/**
 * bamazonSupervisor.js
 * 
 * Supervisor mode access of bamazon
 * 
 * Allows the following operations
 * 	- Viewing all products for sale
 *  - Viewing low inventory items (quantity < 5)
 *  - Adding inventory for an existing item
 *  - Adding a completely new product
 */

/* Dependencies */
var inquirer = require('inquirer');
var mysql = require('mysql');
var cTable = require('console.table');
require('dotenv').config();

var manager_options = [
	'View products for sale',
	'View low inventory products',
	'Add inventory',
	'Add new product',
	'Exit'
]

var low_inventory_threshold = 5;

var products_list = [];
var departments_list = [];

var connection = mysql.createConnection({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	user: process.env.USER,
	password: process.env.PASS,
	database: process.env.DATABASE
});

function display_all_products(){

	console.log("\n"
	+ "Here are ALL the products"
	+ "\n");

	connection.query({
		/* Fetch data from the products table in the bamazon database */
		sql:'SELECT product_id as id, product_name, department_name, price, stock_quantity'
				+ ' FROM products'
				+ ' INNER JOIN departments'
				+ ' ON products.department_id=departments.department_id'
				+ ' ORDER BY id',
		timeout: 30000
		},function(error, results, fields) {
			if(error)  {
				console.log("Error seen " + error);
				reject(error);
				return;
			}

			console.table(results);
			product_inventory = results;

			connection.end();
		}
	);
}

function display_low_inventory(){

	console.log("\n"
							+ "Here are the low inventory products"
							+ "\n");

	connection.query({
		/* Fetch data from the products table in the bamazon database */
		sql:'SELECT product_id as id, product_name, department_name, price, stock_quantity'
				+ ' FROM products'
				+ ' INNER JOIN departments'
				+ ' ON products.department_id = departments.department_id'
				+ ' WHERE stock_quantity < ?',
		timeout: 30000,
		values : [low_inventory_threshold]
		},function(error, results) {
			if(error)  {
				console.log("Error seen " + error);
				reject(error);
				return;
			}

			if(!results.length) {
				console.log("\n" + 
										"None of the products are low on inventory" + 
										"\n");
			}else{
				console.table(results);
			}

			connection.end();
		}
	);
}

function add_inventory(){
	console.log("\n" 
						+ "Inventory update menu"
						+ "\n");

	inquirer.prompt([
		{
			type:'list',
			message:'Select the product',
			choices: products_list,
			name:'selected_product'
		},
		{
			type:'input',
			message:'Enter the quantity being added',
			name:'quantity'
		}
	]).then(function(response){

		let add_quantity = response.quantity;

		if(Number.isNaN(add_quantity) || add_quantity <= 0) {
			console.log("\n Error - Please enter a valid value for quantity \n");
			connection.end();
		}

		console.log("Adding to supply of " + products_list[response.selected_product]);
		console.log("Update quantity is " + add_quantity);

		connection.query({
				sql: "UPDATE products "
						+ "SET stock_quantity=stock_quantity+? "
						+ "WHERE product_id=?",
				timeout : 30000,
				values  : [add_quantity , response.selected_product]
			},
			function(err){
				if(err) throw err;
				console.log("Inventory added successfully");
				connection.end();
		  }
		)
	});
}

function add_new_product(){
	inquirer.prompt([
		{
			type:'input',
			message:'Enter the product name',
			name:'new_product_name'
		},
		{
			type:'input',
			message:'Enter the product price',
			name:'new_product_price'
		},
		{
			type:'input',
			message:'How many items of the new product?',
			name:'new_product_count'
		},
		{
			type:'list',
			choices:departments_list,
			name:'new_product_department'
		}
	]).then(function(response){
		let name = response.new_product_name;
		let count = parseInt(response.new_product_count);
		let department = parseInt(response.new_product_department);
		let price = parseFloat(response.new_product_price);

		if(!name || count < 0 || price < 0.0)
		{
			console.log("Oops, please try again");
			manager_display_menu();
		}

		connection.query(
			{
				sql:'INSERT INTO products(product_name, department_id, price, stock_quantity) '
					 +'VALUES(?,?,?,?)',
				timeout:30000,
				values:[name, department, price, count]
			},
			function(err){
				if(err) throw err;

				console.log("\n New product added successfully!! \n");

				connection.end();
			}
		)
	})
}

 function handle_option(manager_response){
	 
	var option  = manager_response.selection;

	console.log(option);

	switch(option){
		case manager_options[0]: /* View products for sale */
			display_all_products();
			break;
		case manager_options[1]: /* View low inventory products */
			display_low_inventory();
			break;
		case manager_options[2]: /* Add inventory */
			add_inventory();
			break;
		case manager_options[3]: /* Add product */
			add_new_product();
			break;
		default:
			console.log("Goodbye!");
			connection.end();
	}
}

function manager_display_menu(){
  console.log("Welcome to bamazon, noble manager! Choose an option - ")
	
	/* Main menu for options */
	inquirer.prompt([
		{
			type    : 'list',
			message : 'Options',
			choices : manager_options,
			name    : 'selection' 
		}
	]).then(handle_option);
}

function manager_main(){

	/* Connect to the bamazon database.
	 * Once connected, 
	 *  - get the names and IDs of all the products and store them
	 *  - get the names and IDs of all the departments and store them
	 * After that, display the manager menu.
	 */
	connection.connect(function(error){
		if(error) {
			console.log("Oops, bamazon is currently unreachable");
			manager_display_menu();
		}

		/* Get products list - name and ID */
		connection.query({
			sql: 'select product_id,product_name'
			  + ' from products',
			timeout: 30000
		}, function(err, results){

			for(let i = 0; i < results.length; i++){
				let name = results[i].product_name;
				let value = results[i].product_id;
				products_list.push({name, value});
			}
			
			//console.log(products_list);
			
			/* Get departments list - name and ID */
			connection.query(
				{
					sql:'select department_id, department_name from departments',
					timeout: 30000
				},
				function(err, results){
					if(err) throw err;

					for(let i = 0; i < results.length; i++){
						let name = results[i].department_name;
						let value = results[i].department_id;
						departments_list.push({name, value});
					}

					//console.log(departments_list);

					manager_display_menu();
				}
			);
		});
	});
}

manager_main();
