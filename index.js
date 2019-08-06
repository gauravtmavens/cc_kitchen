var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var customModule = require('./customModule');


var connection 	= 	mysql.createConnection({
	host		: 	"localhost",
	user		: 	"user",
	password	: 	"password",
	database	: 	"ccremote"
});

var datetime =new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

module.exorts=connection;

connection.connect(function(err){
	if(err){
	  console.log('Error connecting to Db');
	  return;
	}
	console.log('Connection Esteblished!');
  });

var app = express();

// app.set('views', './views')
// app.set('view engine', 'pug')
app.set('views', './ejs')
app.set('view engine', 'ejs')


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
	// response.render('index', { title: 'Hey', message: 'Hello there!' });
	// if (request.session.loggedin) {
	// 	response.send('Welcome back,'+request.session.username+' !');
	// }
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/app', function(request, response) {
	
	var promise1 = new Promise(function(resolve, reject) {
		reject('foo');
	  });

	  promise1.then(function(value) {
		console.log(value);
		// expected output: "foo"
	  });
	  
	  console.log(promise1);

	response.sendFile(path.join(__dirname + '/appliances.html'));
});

app.post('/update_appliance_usage', function(request, response) {
	var kitchen_id = request.body.kitchen_id;
	var appliance_id = request.body.appliance_id;
	var user_id = request.body.user_id;
	var tenant_id = request.body.tenant_id	;

	var promise1 = new Promise(function(resolve, reject) {
		var usage_result = {};
		connection.query('SELECT * FROM usages WHERE appliance_id  = ? AND user_id = ? AND kitchen_id = ? AND tenant_id = ?', [appliance_id,user_id,kitchen_id,tenant_id], function(error, results, fields) {
			usage_result.usage=results.length;
			usage_result.data=results;
			resolve(usage_result);
		});
	});
	promise1.then(function(value) {
		console.log(value);
		
		var promise2 = new Promise(function(resolve, reject) {
			var sql = "SELECT * FROM tenants WHERE 	kitchen_id =? AND user_id = ?";
			var query = connection.query(sql, [kitchen_id,user_id], function(error, results, fields) {
				resolve(results);
			});
			console.log(query.sql);

		});
		promise2.then(function(value2) {

			if(value.length > 0)
			{

			
				var tenant_id=value2[0].id
				var promise3 = new Promise(function(resolve, reject) {
					if(value.usage == 1)
					{

						console.log('yes');
					}
					else
					{
						var sql = "INSERT INTO usages (kitchen_id, appliance_id, user_id, tenant_id, start, duration, created, modified) VALUES ?";
						var values = [
							[kitchen_id, appliance_id, user_id, tenant_id, datetime, '1', datetime, datetime]
						];
						var query = connection.query(sql, [values], function(error, results, fields) {
							resolve(results);
						});
						console.log(query.sql);
						console.log('no');
					}
				});
				promise3.then(function(value3) {
					// console.log(value2);
					response.send(value3);
				});
			}
			else
			{
				var error={};
				error.message='Tenant is not avaiable';
				error.status='error';
				response.send(error);
			}
		});
		
	});
	

});


app.post('/auth', function(request, response) {
	var pin = request.body.pin;
	
	if (pin) {
		connection.query('SELECT * FROM users WHERE door_pin  = ?', [pin], function(error, results, fields) {
			if (results.length > 0) {
				

				
				var promise1 = new Promise(function(resolve, reject) {
					getSchedule(results[0].default_kitchen,results[0].company_id,datetime ,function(schedule){
						var appliances='(';
						schedule.forEach(function(element) {
							appliances=appliances+element.appliance_id+',';
						});
						appliances=appliances.slice(0, -1);
						appliances=appliances+')';
						
						resolve(appliances);
						
					});
				  });
			
				promise1.then(function(value) {
					getAppliance(results[0].default_kitchen,value ,function(appliance){
						var my_appliances = appliance;	
						var promise2 = new Promise(function(resolve, reject) {
							getKitchen(results[0].default_kitchen, function(kitchen_details){
								resolve(kitchen_details);
							});
						});

						promise2.then(function(kitchen_data) {
							// console.log(kitchen_data);
							response.render('appliance', { appliances: my_appliances, user: results, kitchen_data: kitchen_data});
						});
						
					});
				});
				  
			} 
			else {
				
			}			
		});

	
	
	}	 else {
		response.send('Please enter Pin!');
		response.end();
	}
});




function getSchedule(kitchen,company,datetime , res){ 
	
	connection.query('SELECT * FROM schedules WHERE kitchen_id = ? AND company_id = ? AND start <=  ? AND end >=  ? ', [kitchen,company,datetime,datetime], function(err, result, field) {

      if(err){
        return err;
      }
        res(result);
    });
}

function getKitchen(kitchen, res){ 
	
	connection.query('SELECT * FROM kitchens WHERE id = ? ', [kitchen], function(err, result, field) {

      if(err){
        return err;
      }
        res(result);
    });
}

function getAppliance(kitchen,appliances , res){ 
	
	connection.query('SELECT * FROM appliances WHERE kitchen_id = ? AND type = ? AND id IN '+appliances, [kitchen,'appliance'], function(err, result, field) {

      if(err){
        return err;
      }
        res(result);
    });
}

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back,'+request.session.username+' !');
	} else {
		response.redirect('/');
	}
	response.end();
});

app.get('/logout', function(request, response) {
	request.session.destroy();
	response.redirect('/');
});













app.post('/auth2', function(request, response) {
	var pin = request.body.pin;
	var schedule_result = '1';
	var appliance_result = '1';
	
	if (pin) {
		connection.query('SELECT * FROM users WHERE door_pin  = ?', [pin], function(error, results, fields) {
			if (results.length > 0) {
				
				var datetime =new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				// console.log(datetime);
				var query1 = connection.query('SELECT * FROM schedules WHERE kitchen_id = ? AND company_id = ? AND start <=  ? AND end >=  ? ', [results[0].default_kitchen,results[0].company_id,datetime,datetime], function(error_schedule, results_schedule, fields_schedule, schedule_result) {
					// console.log(results_schedule.length);
					if (results_schedule.length > 0) {
						
						schedule_result=JSON.stringify(results_schedule);
						// response.test=schedule_result;
					
						// console.log(error_schedule);
						// console.log(results_schedule);
						var appliances='(';
						results_schedule.forEach(function(element) {
							// console.log(element);
							appliances=appliances+element.appliance_id+',';
						  });
						  appliances=appliances.slice(0, -1);
						  appliances=appliances+')';
						//   console.log(appliances);
						var query_app=connection.query('SELECT * FROM appliances WHERE kitchen_id = ? AND type = ? AND id IN '+appliances, [results[0].default_kitchen,'appliance'], function(error_applience, results_applience, fields_applience) {
							
							if(results_applience.length > 0)
							{
								
								appliance_result=JSON.stringify(results_applience);
								// console.log(appliance_result);
							}
						   
	
							
						});
						// console.log(query_app.sql);
						
						
					}
					else
					{
						// response.end();
					}
					
				});
				
				console.log(schedule_result);
				// console.log(query1.sql);
				console.log(appliance_result);
				// console.log(schedule_result);
				// console.log(response);
				response.render('index', { title: 'Hey', message: 'Hello there!' });
				
			} 
			else {
				
			}			
		});

	
	
	}	 else {
		response.send('Please enter Pin!');
		response.end();
	}
});








console.log('We are live now...');
app.listen(3002);