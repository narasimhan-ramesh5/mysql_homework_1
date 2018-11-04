/**
 * bamazonCustomer.js
 * 
 * Implements the customer facing interface of Bamazon.
 * 
 */

/**
 *  Globals 
 *  - Libraries (mysql, inquirer, dotenv and console.table)
 */

var mysql = require('mysql');
var connection;
var inquirer = require('inquirer');
var cTable = require('console.table');
require('dotenv').config();

/* Will hold product inventory retrieved from database */
var product_inventory  = [];

/**
 * @function get_initial_data_func
 * 
 * @description
 * This is a function implemented as a Promise. It connects to the 
 * 'bamazon' database and fetches all the contents of the 'products'
 * table.
 * 
 * @param {function} resolve : function to call when the promise is fulfilled
 * @param {function} reject : function to call when the promise is rejected 
 * 
 */
function get_initial_data_func ( resolve , reject ) {
	//console.log("In get_initial_data Promise");

	/* Database connection parameters */
	connection =	mysql.createConnection({
		host: process.env.HOST,
		port: parseInt(process.env.PORT),
		user: process.env.USER,
		password: process.env.PASS,
		database: process.env.DATABASE
	});
	
	/* Connect to the 'products' database. */
	connection.connect(function(error){
		
		if(error) {
			reject(error);
			return;
		}

		/* Fetch data from the products table in the bamazon database */
		connection.query({
			sql:'SELECT product_id as id, product_name, department_name, price, stock_quantity'
					+ ' FROM products'
					+ ' INNER JOIN departments'
					+ ' ON products.department_id = departments.department_id',
			timeout: 30000
		},function( error, results, fields ) {
			if(error)  {
				console.log("Error seen " + error);
				reject(error);
				return;
			}

			console.log("\nWELCOME TO BAMAZON!\n");

			console.log("Here are our available products\n");
			console.table(results);
			product_inventory = results;

			//console.log("Calling promise resolution function");
			resolve();
		});
	});
}

/**
 * @function process_order
 * 
 * @description 
 * This function processes the user's order.
 * It fetches the required number of items, updates the inventory
 * and displays the total cost to the user.
 * 
 * @param {number} order_quantity 
 * @param {number} order_item 
 */
function process_order(order_quantity, order_item){
	/* Query to update database */
	connection.query({
		sql:'SELECT stock_quantity, price'
			 + ' FROM products'
			 + ' WHERE product_id=?',
		values: [order_item],
		timeout: 30000
	}, function( error, results, fields){
		
		if(error){
			connection.end();
			throw error;
		}

		if(results.length !== 1){
			console.log("Weird, I expect to see only one result");
		}

		let available = results[0].stock_quantity;
		let price = results[0].price;

		if(order_quantity > available){
			if(available > 0)
				console.log("sorry, we only have " + available + " in stock");
			else
				console.log("sorry, we are out of stock");
		} else {
			/* There is sufficient inventory for the order to go through.
			   Update the database and display the cost to the user. */
			connection.query({
				sql :'UPDATE products '
							+'SET stock_quantity = stock_quantity - ? '
							+'WHERE product_id = ?',
				values : [order_quantity, order_item]
			}, function(error){
				if(error){
					console.log("Update failed!");
					connection.end();
				} 

				console.log("Update successful");
				let transaction_price = (price *  order_quantity).toFixed(2);

				console.log("Total Cost :  \$" + transaction_price);

			});
		}
		connection.end();
	});

}

/**
 * @function get_user_input
 * @description
 * Display interactive menu to user to view product inventory,
 * and order a product from the bamazon database.
 */
function get_user_input(){
	//console.log("TBD: Inquirer to get user input");

	var display_list = [];
	var num_products = product_inventory.length;

	for(let i = 0; i < num_products; i++){
		let name = product_inventory[i].product_name;
		let value = product_inventory[i].id;
		display_list.push({name, value})
	}

	//console.log(products_list);

	inquirer.prompt(
		[
			{
				type:'list',
				message:'What would you like to buy?',
				choices:display_list,
				name:'chosen_product'
			},
			{
				type:'input',
				message:'How many would you like to buy? Enter a number:',
				name:'quantity',
			}
		]
	).then(function(response){

		let qty_to_buy = parseInt(response.quantity);
		let product_to_buy = parseInt(response.chosen_product);
		
		console.log("User would like to buy " + 
								qty_to_buy + " of " + 
								display_list[product_to_buy - 1].name);

		if(qty_to_buy > 0) {
			process_order(qty_to_buy, product_to_buy);
		} else {
			console.log("Expected an order quantity > 0, bailing out");
			connection.end();
		}
	});
}

function display_database_error(error){
	console.log("Sorry, couldn't connect to database. " + error);
}

function main(){

	/* First display all the inventory and then get user input.
		 If there's an error in connecting to the database, display error */

	var get_initial_data = new Promise(get_initial_data_func);

	get_initial_data.then(get_user_input, display_database_error);

}

main();
