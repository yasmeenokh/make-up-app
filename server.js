'use strict'; 

require('dotenv').config();
const express = require('express');
const server = express();
const superAgent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const methodOverride = require('method-override');
const cors = require('cors');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, 
    // ssl: { rejectUnauthorized: false } 
});

server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));
server.use(express.static('./public'));
server.set('view engine', 'ejs');

server.get('/', homePage);
server.post('/productByPrice', productByPrice);
server.get('/allProducts', allProducts);
server.post('/myCard', SaveMyCard);
server.get('/myCard', renderMyCard);
server.get('/details/:id', viewDetails);
server.post('/delete/:id', deleteProduct);
server.post('/update/:id', updateProduct)

function homePage (request , response){
    response.render('pages/index')
}

function productByPrice (request, response){
    let brand= request.body.maybelline;
    let max= request.body.maxPrice;
    let min = request.body.minPrice;
    let url =`http://makeup-api.herokuapp.com/api/v1/products.json?brand=${brand}&price_greater_than=${min}&price_less_than=${max}`
    superAgent.get(url)
    .then(results=>{
        // console.log(results.body)
        response.render('pages/productByPrice', {data : results.body})
    })
}
function allProducts (request, response){
    let url ='http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline';
    superAgent.get(url)
    .then(results=>{
        let apiData = results.body.map(element => new Product (element))
        response.render('pages/allProducts', {data : apiData})
    })
}
function SaveMyCard (request, response){
    let {name, price, image_link, description} = request.body;
    let SQL = 'INSERT INTO products (name, price, image_link, description) VALUES ($1, $2, $3, $4) RETURNING *;';
    let safeValues = [name, price, image_link, description];
    client.query(SQL, safeValues)
    .then(results=>{
        response.redirect('/myCard')
    })
}
function renderMyCard (request, response){
    let SQL = ' SELECT * FROM products ;';
    client.query(SQL)
    .then(results=>{
        response.render('pages/myCard', {data : results.rows})
    })
}
function viewDetails (request, response){
    let SQL = 'SELECT * FROM products WHERE id=$1 ;';
    let safeValues = [request.params.id];
    client.query(SQL, safeValues)
    .then(results=>{
        response.render('pages/details', {element: results.rows[0]})
    })
}
function deleteProduct (request, response){
    let SQL = 'DELETE FROM products WHERE id=$1 ;';
    let safeValues = [request.params.id];
    client.query(SQL, safeValues)
    .then(results=>{
        response.redirect('/myCard')
    })
}
function updateProduct (request, response){
    let {name, price, image_link, description} = request.body;
    let SQL = 'UPDATE products SET name=$1, price=$2, image_link=$3, description=$4 WHERE id=$5 RETURNING *;';
    let safeValues = [name, price, image_link, description, request.params.id];
    client.query(SQL, safeValues)
    .then(results=>{
        response.render('pages/details', {element: results.rows[0]})
    })
}


function Product (info){
    this.name = info.name;
    this.price = info.price;
    this.image_link = info.image_link;
    this.description = info.description;
}

client.connect()
.then(()=>{
    server.listen(PORT, ()=>{
        console.log(`listening on ${PORT}`)
    })
})