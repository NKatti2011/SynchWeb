<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

// Group different routes under the same path
return function (App $app) {
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        // CORS Pre-Flight OPTIONS Request Handler
        return $response;
    });

    // // App routes
    // $app->get('/',         'App\Application\Controllers\HomeController:index')->setName('root');
    // $app->get('/addData',  'App\Application\Controllers\HomeController:addData')->setName('addData');

    // API routes
    $app->post('/login', 'SynchWeb\Authentication:doLogin')->setName('apiLogin');
    $app->post('/authenticate', 'SynchWeb\Authentication:doLogin')->setName('auth');
    // $app->group('/api', function (Group $group) {
    //     $group->post('/login', 'SynchWeb\Authentication:doLogin')->setName('apiLogin');
    //     // $group->post('/records', 'App\Application\Controllers\RecordsController:sendData')->setName('apiSend');
    // });
};