<?php
/*
    Copyright 2015 Diamond Light Source <stuart.fisher@diamond.ac.uk>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
use Slim\Factory\AppFactory;
use Slim\Routing\RouteContext;
use Slim\Exception\HttpNotFoundException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface;
use SynchWeb\Authentication;
use SynchWeb\Database\Type\MySQL;
use SynchWeb\Dispatch;
use SynchWeb\User;

require 'vendor/autoload.php';

require 'config.php';

date_default_timezone_set($timezone);

session_cache_limiter(false);

$app = AppFactory::create();
$app->setBasePath("/api");

// intercept http calls to ensure authentication has been done
$loggedInMiddleware = function($request, $handler): ResponseInterface {
    print_r("here i am...");
    $routeContext = RouteContext::fromRequest($request);
    $route = $routeContext->getRoute();

    // if (empty($route)) { throw new HttpNotFoundException($request, "No route specified."); }

    $routeName = $route->getName();

    // Define public routes - i.e. those which do not require authentication.
    $publicRoutesArray = array('login', 'auth');

    // if no auth details available, redirect to login page
    var_dump("User ID: ".(empty($_SESSION['user']) ? ' none' : $_SESSION['user']));
    // var_dump($route);
    // var_dump($publicRoutesArray);
    var_dump("Accessing route: ".$routeName);
    if (empty($_SESSION['user']) && (!in_array($routeName, $publicRoutesArray))) {
        print_r("doing redirect...");
        // Create a redirect for a named route
        $routeParser = $routeContext->getRouteParser();
        $url = $routeParser->urlFor('apiLogin');
        print_r("GOT URL: ".$url);

        $response = new \Slim\Psr7\Response();

        return $response->withHeader('Location', $url)->withStatus(302);
    } else {
        print_r("we're through...");
        // otherwise, allow request through
        $response = $handler->handle($request);

        return $response;
    }
};
$app->add($loggedInMiddleware);

$app->addRoutingMiddleware();

// Register routes
$routes = require __DIR__ . '/routes.php';
$routes($app);


$displayErrorDetails = true;
$logErrors = true;
$logErrorDetails = true;
if ($mode == 'production') {
    $displayErrorDetails = false;
    $logErrors = false;
    $logErrorDetails = false;
}
$app->addErrorMiddleware($displayErrorDetails, $logErrors, $logErrorDetails);

// $app = new Slim(array(
//     'mode' => $mode == 'production' ? 'production' : 'development'
// ));

// $app->configureMode('production', function () use ($app) {
//     $app->config(array(
//         'log.enable' => true,
//         'debug' => false
//     ));
// });

// $app->configureMode('development', function () use ($app) {
//     $app->config(array(
//         'log.enable' => false,
//         'debug' => true
//     ));
// });

$app->get('/options', function (Request $request, Response $response) use ($app) {
    global $motd, $authentication_type, $cas_url, $cas_sso, $package_description, $facility_courier_countries, $facility_courier_countries_nde, $dhl_enable, $dhl_link, $scale_grid, $preset_proposal, $timezone, $valid_components, $enabled_container_types;
    // $app->contentType('application/json');
    // $app->response()->body(json_encode(array('motd' => $motd, 'authentication_type' => $authentication_type, 'cas_url' => $cas_url, 'cas_sso' => $cas_sso, 'package_description' => $package_description, 'facility_courier_countries' => $facility_courier_countries, 'facility_courier_countries_nde' => $facility_courier_countries_nde, 'dhl_enable' => $dhl_enable, 'dhl_link' => $dhl_link, 'scale_grid' => $scale_grid, 'preset_proposal' => $preset_proposal, 'timezone' => $timezone, 'valid_components' => $valid_components, 'enabled_container_types' => $enabled_container_types)));
    $response->withStatus(200)
        ->withHeader('Content-Type', 'application/json')
        ->getBody()->write(json_encode(array(  'motd' => $motd, 
                                    'authentication_type' => $authentication_type, 
                                    'cas_url' => $cas_url, 
                                    'cas_sso' => $cas_sso, 
                                    'package_description' => $package_description, 
                                    'facility_courier_countries' => $facility_courier_countries, 
                                    'facility_courier_countries_nde' => $facility_courier_countries_nde, 
                                    'dhl_enable' => $dhl_enable, 
                                    'dhl_link' => $dhl_link, 
                                    'scale_grid' => $scale_grid, 
                                    'preset_proposal' => $preset_proposal, 
                                    'timezone' => $timezone, 
                                    'valid_components' => $valid_components, 
                                    'enabled_container_types' => $enabled_container_types)));
    return $response;
});

// the following prevents unexpected effects when using objects as save handlers
register_shutdown_function('session_write_close');

$port = array_key_exists('port', $isb) ? $isb['port'] : null;

// MySQL database class hard-coded
$db = new MySQL($isb['user'], $isb['pass'], $isb['db'], $port);

// Alternatively, use dynamic class instantiation.
// Database type ($dbtype) specified in config.php.
// $db = Database::get();

$db->set_app($app);

$auth = new Authentication($app, $db);
// $auth->check_auth_required();

$login = $auth->get_user();
$user = new User($login, $db, $app);

if ($user->login) {
    $chk = $db->pq("SELECT TIMESTAMPDIFF('SECOND', datetime, CURRENT_TIMESTAMP) AS lastupdate, comments FROM adminactivity WHERE username LIKE :1", array($user->login));
    if (sizeof($chk)) {
        if ($chk[0]['LASTUPDATE'] > 20) $db->pq("UPDATE adminactivity SET datetime=CURRENT_TIMESTAMP WHERE username=:1", array($user->login));
    }
}




$type = new Dispatch($app, $db, $user);
$type->dispatch();