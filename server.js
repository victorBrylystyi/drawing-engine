/* eslint-disable no-process-env */
let path = require( 'path' );
let express = require( 'express' );

let app = express();

app.use( express.static( path.join( __dirname, '/build' ) ) );
app.set( 'port', process.env.PORT || 8080 );

let server = app.listen( app.get( 'port' ), () => {
	console.log( 'listening on port ', server.address().port );
} );
