'use strict';

require('dotenv').config();

const superagent = require('superagent');
const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT;


// location route, returns location object
// Keys: search_query, formatted_query, latitude and longitude
app.get('/location', getLocation);

// weather route, returns an array of forecast objects
// Keys: forecast, time
app.get('/weather', getWeather);

// create a getMeetups function
app.get('/meetups', getMeetups);

// TODO: create a getYelp function
// app.get('/yelp', getYelp);


app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// HELPER FUNCTIONS

// takes search request and convert to location object
function getLocation(req, res) {
  const mapsURL = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_MAPS_API_KEY}&address=${req.query.data}`;
  return superagent.get(mapsURL)
    .then(result => {
      res.send(new Location(result.body.results[0], req.query));
    })
    .catch(error => handleError(error));
}

// returns array of daily forecasts
function getWeather(req, res) {
  const dark_sky_url = `https://api.darksky.net/forecast/${process.env.DARK_SKY_API_KEY}/${req.query.data.latitude},${req.query.data.longitude}`;
  
  return superagent.get(dark_sky_url)
    .then( weatherResult => {
      const weatherSummaries = weatherResult.body.daily.data.map((day) => {
        return new Forecast(day);
      });
      res.send(weatherSummaries);
    })
    .catch(error => handleError(error));
}

// Meetups function
function getMeetups(req,res) {
  const meetup_url = `https://api.meetup.com/find/upcoming_events?lat=${req.query.data.latitude}&lon=${req.query.data.longitude}&sign=true&photo-host=public&page=20&key=${process.env.MEETUP_API_KEY}`;

  return superagent.get(meetup_url)
    .then(result => {
      const eventsList = result.body.events.map(event => {
        return new Event(event);
      });
      res.send(eventsList);
    })
    .catch(error => handleError(error));
}

// Event object constructor
function Event(data){
  this.link = data.link;
  this.name = data.name;
  this.creation_date = formatTime(data.created);
  this.host = data.group.name;
}

// Location object constructor
function Location(data, query) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}

// Forecast object constructor
function Forecast(day) {
  this.forecast = day.summary;
  this.time = formatTime(day.time*1000);
}

// converts millisecond time to 'Day Month Date Year' format
function formatTime(msTime) {
  return new Date(msTime).toString().slice(0,15);
}
