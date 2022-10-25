const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "moviesData.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const pascalTOCamelCase = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const dirPascalTOCamelCase = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  };
};

//get all details from database

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name FROM movie order by movie_id;`;
  const moviesArray = await database.all(getMoviesQuery);
  response.send(moviesArray.map((eachMovie) => pascalTOCamelCase(eachMovie)));
});
//get Movie deatails

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
  SELECT * FROM movie WHERE movie_id = ${movieId};
  `;
  const movieResponse = await database.get(getMovieQuery);

  response.send(pascalTOCamelCase(movieResponse));
});

//create new movie

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const createMovieQuery = `
    INSERT INTO movie (director_id,movie_name,lead_actor)
    VALUES (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );
    `;
  const dbResponse = await database.run(createMovieQuery);
  // const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

// upateMovieDetails

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const updatingDetails = request.body;
  const { directorId, movieName, leadActor } = updatingDetails;

  const updatingDetailsQuery = `
    UPDATE movie
     SET
   director_id = ${directorId},
   movie_name = '${movieName}',
   lead_actor = '${leadActor}'

    WHERE movie_id = ${movieId}
    `;
  await database.run(updatingDetailsQuery);
  response.send("Movie Details Updated");
});

//Delete movie details

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deletionQuery = `
    DELETE FROM movie WHERE
    movie_id = ${movieId};
    `;
  await database.run(deletionQuery);
  response.send("Movie Removed");
});

//Get all directors list

app.get("/directors/", async (request, response) => {
  const getDirectorsListQuery = `
    SELECT *  FROM director ORDER BY director_id;
    `;
  const getDirectorDetails = await database.all(getDirectorsListQuery);
  response.send(
    getDirectorDetails.map((eachDirector) => dirPascalTOCamelCase(eachDirector))
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieByDirectorQuery = `
    SELECT movie.movie_name
     FROM
     movie JOIN director ON movie.director_id = director.director_id
    WHERE movie.director_id =  ${directorId}
    ;
    `;
  const dataResponse = await database.all(getMovieByDirectorQuery);
  response.send(dataResponse.map((eachName) => pascalTOCamelCase(eachName)));
});

module.exports = app;
