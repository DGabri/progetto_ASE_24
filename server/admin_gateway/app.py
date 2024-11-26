from flask import Flask, request, Response, jsonify
from urllib.parse import urljoin
import requests
import logging
import jwt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['WTF_CSRF_ENABLED'] = False

# microservices urls mapping
MICROSERVICES_URLS = {
    "auction": "http://auction:5000",
    "auth": "http://auth:5000",
    "banner": "http://banner:5000",
    "piece": "http://piece:5000",
    "user": "http://user:5000"
}

# No public route so you have to be authenticated as admin
PUBLIC_ROUTES = {}

def verify_authentication_authorization(token, route, method):
    try:
        auth_response = requests.post(
            f"{MICROSERVICES_URLS['auth']}/authorize",
            json={
                "token": token,
                "route": route,
                "method": method
            },
            timeout=10
        )
        return auth_response.json(), auth_response.status_code
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Auth service error: {str(e)}")
        return {"error": "Auth service unavailable"}, 503

# tells if the requested route is public    
def is_public_auth_route(method, microservice, path):
    route = f"{microservice}/{path}"
    return (method, route) in PUBLIC_ROUTES

@app.route('/<microservice>/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/<microservice>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def user_gateway(microservice, path):
    if microservice not in MICROSERVICES_URLS:
        return jsonify({"error": f"Service: '{microservice}' not found"}), 404

    # create target url
    target_microservice = MICROSERVICES_URLS[microservice]
    target_url = f"{target_microservice}/{path}"
    logger.info(f"Forwarding to: {microservice} {target_url}")

    # login is not required to register a new user
    if not is_public_auth_route(request.method, microservice, path):
        authentication_header = request.headers.get("Authorization")
        
        if not authentication_header or not authentication_header.startswith("Bearer "):
            return jsonify({"error": "Login required"}), 401
        
        token = authentication_header.split(' ')[1]
        
        # verify action with auth service
        auth_response, auth_return_code = verify_authentication_authorization(token, path, request.method)
        logging.info(f"[USER GATEWAY] auth_response: {auth_response} response code: {auth_return_code}")
        if auth_return_code != 200:
            if auth_return_code == 401:
                return jsonify({"error": "Please login"}), 401
            elif auth_return_code == 403:
                return jsonify({"error": "Insufficient permissions"}), 403
            else:
                return jsonify(auth_response), auth_return_code
            
    try:
        # forward request to microservice
        response = requests.request(
            method=request.method,
            url=target_url,
            data=request.get_data(),
            headers={key: value for key, value in request.headers if key != 'Host'},
            params=request.args,
            allow_redirects=False,
            timeout=10
        )

        # forward response to caller
        return Response(response.content, status=response.status_code, headers=dict(response.headers))

    except requests.exceptions.RequestException as e:
        return {"error": "Service unavailable"}, 503

if __name__ == '__main__':
    app.run(port=80)