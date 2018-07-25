const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

let campgrounds = [
  {name:'Yellow Stone', image: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=5cedc6b95f731395da7269d2341f9a5e&auto=format&fit=crop&w=1050&q=80'},
  {name:'Summer Valley Trail', image: 'https://images.unsplash.com/photo-1496545672447-f699b503d270?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=ba3fa37b995a705a01d022cada13f726&auto=format&fit=crop&w=1051&q=80'},
  {name:'Tree Stump Forest', image: 'https://images.unsplash.com/photo-1496080174650-637e3f22fa03?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=b7ca353cfcc4299e6c3d431ff862e1cf&auto=format&fit=crop&w=1006&q=80'},
]

app.get('/', (req, res, next) => {

});

app.get('/campgrounds', (req, res, next) => {

});

app.post('/campgrounds', (req, res, next) => {

});
