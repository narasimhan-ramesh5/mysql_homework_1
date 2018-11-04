/**
 * bamazonSupervisor.js
 * 
 * Supervisor mode access of bamazon
 * 
 * Allows the following operations
 * 	- 
 */

/* Dependencies */
var inquirer = require('inquirer');
var mysql = require('mysql');
var cTable = require('console.table');
require('dotenv').config();

var supervisor_options = [
	'View product sales by department',
	'Create department',
	'Exit'
]

var departments_list = [];

var connection = mysql.createConnection({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	user: process.env.USER,
	password: process.env.PASS,
	database: process.env.DATABASE
});

function display_all_departments(){

	console.log("\n"
	+ "Here are ALL the products"
	+ "\n");

	connection.query({
		/* Fetch data from the products table in the bamazon database */
		sql:'SELECT *'
				+ ' FROM departments'
				+ ' ORDER BY department_id',
		timeout: 30000
		},function(error, results, fields) {
			if(error)  {
				console.log("Error seen " + error);
				reject(error);
				return;
			}

			for(let i = 0; i < results.length; i++){
				results[i].profit = results[i].product_sales - results[i].overhead;
			}

			console.table(results);
			product_inventory = results;

			connection.end();
		}
	);
}

function add_new_department(){
	inquirer.prompt([
		{
			type:'input',
			message:'Enter the department name',
			name:'dept_name'
		},
		{
			type:'input',
			message:'Enter the department overhead',
			name:'dept_overhead'
		},
		{
			type:'input',
			message:'Enter the initial sales figures for this department',
			name:'dept_sales'
		}
	]).then(function(response){
		let name = response.dept_name;
		let overhead = parseFloat(response.dept_overhead);
		let sales = parseFloat(response.dept_sales);

		if(!name || overhead < 0.0)
		{
			console.log("Oops, please try again");
			supervisor_display_menu();
		}

		connection.query(
			{
				sql:'INSERT INTO departments(department_name, overhead, product_sales) '
					 +'VALUES(?,?,?)',
				timeout:30000,
				values:[name, overhead, sales]
			},
			function(err){
				if(err) throw err;

				console.log("\n New department added successfully!! \n");

				connection.end();
			}
		)
	})
}

 function handle_option(supervisor_response){
	 
	var option  = supervisor_response.selection;

	console.log(option);

	switch(option){
		case supervisor_options[0]: /* View products for sale */
			display_all_departments();
			break;
		case supervisor_options[1]: /* View low inventory products */
			add_new_department();
			break;
		default:
			console.log("Goodbye!");
			connection.end();
	}
}

function supervisor_display_menu(){
  console.log("Welcome to bamazon, noble supervisor! Choose an option - ")
	
	/* Main menu for options */
	inquirer.prompt([
		{
			type    : 'list',
			message : 'Options',
			choices : supervisor_options,
			name    : 'selection' 
		}
	]).then(handle_option);
}

function supervisor_main(){
	supervisor_display_menu();
}

supervisor_main();
