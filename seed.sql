-- Delete the database if it exists --
DROP DATABASE IF EXISTS bamazon;

-- Create the database --
CREATE DATABASE bamazon;

-- Switch to the 'bamazon' database --
USE bamazon;

-- Create the 'departments' table --
CREATE TABLE departments(
	department_id INT(11) NOT NULL AUTO_INCREMENT,
	department_name VARCHAR(50) NOT NULL,
	overhead DECIMAL(10,2) NOT NULL,
	product_sales DECIMAL(10,2) NOT NULL,
  PRIMARY KEY(department_id)
);

-- Create the 'products' table --
CREATE TABLE products(
	product_id INT(11) NOT NULL AUTO_INCREMENT,
	product_name VARCHAR(100) NOT NULL,
	department_id INT(11) NOT NULL,
	price DECIMAL(10,2) NOT NULL,
	stock_quantity INT(11) NOT NULL,
	PRIMARY KEY(product_id),
	FOREIGN KEY(department_id) REFERENCES departments(department_id)
);

INSERT INTO departments (department_name, overhead, product_sales)
VALUES
('Electronics', 10000.00, 0.00),
('Apparel', 5000.00, 0.00),
('Furniture', 15000.00, 0.00),
('Cosmetics', 2500.00, 0.00);

INSERT INTO products (product_name, department_id, price, stock_quantity)
VALUES
('Dizzy Drones Quadcopter', 1, 500.00, 30),
('KhromeCast Digital Media Player', 1, 29.99, 100),
('Bevlon Lipstick', 4, 20.00, 200),
('LazyCoder Reclining Chair', 3, 500.00, 10),
('Dad Jeans', 2, 24.99, 300);

