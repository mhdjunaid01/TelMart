var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session =require('express-session');
var nocache = require('nocache');
var expbs = require('express-handlebars');
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var db = require('./config/connection');
const hbsHelpers = require('./helpers/register-helpers');
var app = express();


const hbs = expbs.create({
    extname:'hbs',defaultLayout:'layout',
    layoutsDir:__dirname+'/views/layout/',
    partialDir:__dirname+'/views/partials/',
    helpers:{
        ifEquals:hbsHelpers.ifEquals,
        returA:hbsHelpers.returA
    }
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine);
// app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialDir:__dirname+'/views/partials/'}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:process.env.secret,cookie:{maxAge:1000000},resave:false,saveUninitialized:false}));
app.use(nocache());
app.use('/', usersRouter);
app.use('/admin', adminRouter);

app.use('/admin/*',(req,res)=>{
    res.render('admin/error');
});


app.use('/*',(req,res)=>{
    res.render('users/error');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

db.connect((err)=>{
    if(err)console.log(err);
    else console.log('database connected');
});
// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});



module.exports = app;
