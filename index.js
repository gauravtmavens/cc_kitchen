var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');


var connection 	= 	mysql.createConnection({
	host		: 	"localhost",
	user		: 	"user",
	password	: 	"password",
	database	: 	"ccremote"
	// host		: 	"172.11.2.4",
	// user		: 	"root",
	// password	: 	"root_password",
	// database	: 	"ccremote"
});


var constants = require('./constants');

var datetime =new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');


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
	var kitchen_id=1;
	connection.query('SELECT * FROM appliances WHERE kitchen_id  = ? and running = 1', [kitchen_id], function(error, results, fields) {
		console.log(results);
		response.render('running_appliance', { running_appliances: results});
	});
	
});

app.get('/login', function(request, response) {
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


app.get('/schedule', function(request, response) {
	
	var kitchen_id=1;
	var datetime =new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	connection.query('SELECT * FROM schedules WHERE kitchen_id  = ? AND start <=  ? AND end >=  ? ', [kitchen_id,datetime,datetime], function(error, results, fields) {
		console.log(results);
		response.render('schedule', { running_appliances: results});
	});
});



app.post('/update_running_status', function(request, response) {
	var id = request.body.id;

	var promise1 = new Promise(function(resolve, reject) {
		var usage_result = {};
		var q = connection.query('SELECT * FROM appliances WHERE id  = ? ', [id], function(error, results, fields) {
			usage_result.usage=results.length;
			usage_result.data=results;
			resolve(usage_result);
		});
	});
	promise1.then(function(value) {
		
		var promise2 = new Promise(function(resolve, reject) {
			var usage_data=value.data;
			if(usage_data[0].running == 0)
			{
				var running_status = 1;
			}
			else
			{
				var running_status = 0;
			}
			var sql = "UPDATE appliances SET running = "+running_status+" WHERE id = "+usage_data[0].id;
			var query = connection.query(sql, function(error, update_results, fields) {
				var result_data = {};
				result_data.message="message";
				result_data.status="status";
				result_data.running_status=running_status;
				resolve(result_data);
			});
		});
		promise2.then(function(value3) {
			console.log(value3);
			response.send(value3);
		});

	});


});
app.post('/update_appliance_usage', function(request, response) {
	var kitchen_id = request.body.kitchen_id;
	var appliance_id = request.body.appliance_id;
	var user_id = request.body.user_id;
	var tenant_id = request.body.tenant_id;
	var result_data= {};
	var promise1 = new Promise(function(resolve, reject) {
		var usage_result = {};
		var q = connection.query('SELECT * FROM usages WHERE appliance_id  = ? AND user_id = ? AND kitchen_id = ? AND tenant_id = ?', [appliance_id,user_id,kitchen_id,tenant_id], function(error, results, fields) {
			usage_result.usage=results.length;
			usage_result.data=results;
			resolve(usage_result);
		});
	});
	promise1.then(function(value) {
		var promise2 = new Promise(function(resolve, reject) {
			
			if(value.usage == 1)
			{
				var usage_data=value.data;
				var sql = "UPDATE usages SET running = 1 WHERE id = "+usage_data[0].id;
				var query = connection.query(sql, function(error, update_results, fields) {
					result_data.message="message";
					result_data.status="status";
					result_data.data=update_results;
					resolve(update_results);
				});
			}
			else
			{
				var sql = "INSERT INTO usages (kitchen_id, appliance_id, user_id, tenant_id, start, duration, created, modified) VALUES ?";
				var values = [
					[kitchen_id, appliance_id, user_id, tenant_id, datetime, '1', datetime, datetime]
				];
				var query = connection.query(sql, [values], function(error, insert_results, fields) {
					result_data.message="message";
					result_data.status="status";
					result_data.data=insert_results;
					resolve(insert_results);
				});
			}
		});
		promise2.then(function(value3) {
			response.send(value3);
		});
			
		
	});
	

});


app.get('/appliances', function(request, response) {
	if (request.session.loggedin) {

		}
	else
	{
		response.redirect('/');
	}
});
app.post('/appliances', function(request, response) {
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
							var promise3 = new Promise(function(resolve, reject) {

								var sql = "SELECT * FROM tenants WHERE 	kitchen_id =? AND user_id = ?";
								connection.query(sql, [kitchen_data[0].id,results[0].id], function(error, tenant_results, fields) {
									resolve(tenant_results);
								});

							});
							promise3.then(function(tenant_results) {
								request.session.loggedin = true;
								response.render('appliance', { appliances: my_appliances, user: results, kitchen_data: kitchen_data, tenant_results: tenant_results});
							});
							
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
	// request.session.destroy();
	request.session.loggedin = false;
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
				console.log(appliance_result);
				// console.log(schedule
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