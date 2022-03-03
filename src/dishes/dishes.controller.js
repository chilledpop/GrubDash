const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


// validation middleware functions 

function isValidDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (isNaN(price) || price <= 0) {
    return next({
      status: 400, 
      message: "Dish must have a price that is an integer greater than 0"
    });
  }

  const requiredProperties = [ "name", "description", "price", "image_url" ];
  for (let property of requiredProperties) {
    if (!req.body.data[property]) {
      return next({
        status: 400,
        message: `Dish must be include a ${property}`,
      });
    }
  }

  res.locals.dish = { data: { name, description, price, image_url } };
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === Number(dishId));

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  })
} 

function idMatch(req, res, next) {
  const { dishId } = req.params;
  const id = req.body.data.id;

  if (dishId !== id && id !== "" && id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    })
  }

  next();
}


// route handlers

// GET endpoint
function list(req, res) {
  res.json({ data: dishes });
}

// POST endpoint
function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// route handler for /dishes/dishId path
function read(req, res) {
  res.json({ data: res.locals.dish})
}


// PUT endpoint
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [isValidDish, create],
  read: [dishExists, read],
  update: [dishExists, isValidDish, idMatch, update],
}