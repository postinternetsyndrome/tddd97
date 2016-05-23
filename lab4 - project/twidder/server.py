import os
import sqlite3
import string
import random
import time
import json
import database_helper
from flask import Flask, request, g
from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler

app = Flask(__name__)
app.debug = True
websockets = {}
recent_messages_entries = 60
recent_messages_resolution = 60
recent_messages_timewindow = recent_messages_entries * recent_messages_resolution

# DEBUG AND TESTING
@app.route('/')
def hello():
    return app.send_static_file('client.html')

@app.route('/dbreset')
def dbreset():
    print "dbinit(): running init()"
    database_helper.reset_database(app)
    return 'DEBUG: database initialized'

@app.route('/helper_test')
def test_helper():
    return database_helper.helper_test()

@app.route('/get_gender')
def getgender():
    return database_helper.get_gender()
  
# ACTUAL STUFF
@app.before_first_request
def initialization():
    if database_helper.purge_active_users():
        print "Active users purged"
        return True
    print "Active users was not purged"
    return False

@app.route('/sign_in', methods = ['POST'])
def sign_in():
    email = request.form["email"]
    password = request.form["password"]
    if '@' in email :
        userdata = database_helper.get_user_by_email(email)
        if userdata != None and userdata[6] == password :
            ws = websockets.get(email, None)
            if ws != None :
                if not ws["websocket"].closed :
                    ws["websocket"].send(json.dumps({"messagetype": "forcedLogout", "message": "Forced logout: User signed in from other location."}))
                    websockets[email]['websocket'].close(1000, "Another user logged in")
                database_helper.remove_active(database_helper.get_active_by_email(email))
                #del websockets[email]
                
            if database_helper.get_active_by_email(email) != None :
                database_helper.remove_active_by_email(email)
                
            print "sign_in(): Generating token."
            token = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(36))
            success = database_helper.add_active(token, email)
            print "sign_in(): database_helper.add_active(token, email) = " + str(success)
            if success == True :
                update_user_count()
                return json.dumps({"success": True, "message": "Successfully signed in.", "data": token})
    return json.dumps({"success": False, "message": "Wrong username or password."})

@app.route('/sign_up', methods = ['POST'])
def sign_up():
    email = request.form["email"]
    password = request.form["password"]
    firstname = request.form["firstname"]
    familyname = request.form["familyname"]
    gender = request.form["gender"]
    city = request.form["city"]
    country = request.form["country"]
    
    if '@' in email and len(password) > 7 and firstname and familyname and gender and city and country :
        if database_helper.get_user_by_email(email) == None :
            print "ENTERED SIGN_IF_STATEMENT"
            success = database_helper.add_user(email, password, firstname, familyname, gender, city, country)
        else :
            return json.dumps ({"success": False, "message": "User already exists."})           
    else : 
        print "email:'"+email+"' password:'"+password+"' firstname:'"+firstname+"' familyname:'"+familyname+"' gender:'"+gender+"' city:'"+city+"' country:'"+country

        return json.dumps ({"success": False, "message": "Form data missing or incorrect type."})
        
    if success == False :
        return json.dumps ({"success": False, "message": "Error adding user to database."})
    update_user_count()
    return json.dumps({"success": True, "message": "Successfully created a new user."})

@app.route('/sign_out', methods = ['POST'])
def sign_out():
    token = request.form["token"]
    email = database_helper.get_active(token)
    ret = database_helper.remove_active(token)
    
    if email != None :
        if websockets.get(email, None) != None :
            websockets[email]['websocket'].close(1000, "You've signed out")
        if ret :
            update_user_count()
            return json.dumps ({"success": True, "message": "Successfully signed out."})
    else :
        return json.dumps ({"success": False, "message": "You are not signed in."})

@app.route('/change_password', methods = ['POST'])
def change_password():
    token = request.form["token"]
    oldpass = request.form["oldpassword"]
    newpass = request.form["newpassword"]
    
    email = database_helper.get_active(token)
    print email
    if email == None :
        return json.dumps({"success": False, "message": "You are not logged in."})

    userdata = database_helper.get_user_by_email(email)
    if userdata[6] != oldpass :
        return json.dumps({"success": False, "message": "Wrong password."})
    
    success = database_helper.change_password(email, newpass)
    if success == True :
        return json.dumps({"success": True, "message": "Password changed."})
    else :
        return json.dumps({"success": False, "message": "Password change failed."})

def get_user_data_helper(token, email):
    userdata = database_helper.get_user_by_email(email)
        
    if database_helper.get_active(token) == None :
        return json.dumps({"success": False, "message": "You are not signed in."});

    if userdata == None :
        return json.dumps({"success": False, "message": "No such user."})
    else :
        if database_helper.increment_user_visits(email) :
            print "get_user_data_by_email(): increment_user_visits() succeeded"
        else:
            print "get_user_data_by_email(): increment_user_visits() failed"
        update_visit_count()
        data = {
                "email": userdata[0],
                "firstname": userdata[1],
                "familyname": userdata[2],
                "gender": userdata[3], 
                "city": userdata[4],
                "country": userdata[5]}
        return json.dumps({"success": True, "message": "User data retrieved.", "data": data})

@app.route('/get_user_data_by_email/<email>/<token>')
def get_user_data_by_email(email, token):
    return get_user_data_helper(token, email)

@app.route('/get_user_data_by_token/<token>')
def get_user_data_by_token(token):
    email = database_helper.get_active(token)
    if email != None :
        return get_user_data_helper(token, email)
    else :
        return json.dumps({"success": False, "message": "You are not signed in."});

# Borde vara GET.
@app.route('/get_login_status/<token>')
def get_login_status(token):
    email = database_helper.get_active(token)
    if email == None :
        return json.dumps({"success": False, "message": "You are not signed in."})
    return json.dumps({"success": True, "message": "You are signed in."})

def get_user_messages_helper(token, email):
    if database_helper.get_active(token) == None :
        return json.dumps({"success": False, "message" : "You are not signed in."})
    if database_helper.get_user_by_email(email) == None :
        return json.dumps({"success": False, "message" : "No such user."})
    
    messages = database_helper.get_messages(email)
    
    message_list = []
    for (recipient, sender, time, message) in messages : 
        json_message  = {"sender" : sender, "time" : time, "message" : message}
        message_list.append(json_message)
    return json.dumps({"success": True, "message" : "User messages retrieved", "data" : message_list})

@app.route('/get_user_messages_by_email/<email>/<token>')
def get_user_messages_by_email(email, token) :
    return get_user_messages_helper(token, email)

@app.route('/get_user_messages_by_token/<token>')
def get_user_messages_by_token(token) :
    email = database_helper.get_active(token)
    if email == None :
        return json.dumps({"success": False, "message": "You are not signed in."})
    return get_user_messages_helper(token, email)

@app.route('/post_message', methods = ['POST'])
def post_message():
    token = request.form["token"]
    message = request.form["message"]
    email = request.form["email"]
    sender = database_helper.get_active(token)
    if sender == None :
        return json.dumps({"success": False, "message": "You are not signed in."})
    if database_helper.get_user_by_email(email) == None :
        return json.dumps({"success": False, "message" : "No such user."})
        
    post_time = int(time.time())
    success = database_helper.add_message(email, sender, post_time, message)
    
    if success == True :
        update_message_count(email)
        return json.dumps({"success": True, "message": "Message posted."})
    return json.dumps({"success": False, "message": "Failed to post message."})

@app.route('/websocket/<token>')
def websocket(token):
    if request.environ.get('wsgi.websocket'):
        email = database_helper.get_active(token)
        if (email != None) :
            ws = request.environ['wsgi.websocket']
            websockets[email] = {"websocket": ws, "sema": None}
            update_user_count()
            while ws.receive() != None :
               pass
            del websockets[email]
    return "websocket(): done"

@app.route('/get_graph_data/<token>')
def get_graph_data(token):
    email = database_helper.get_user_by_token(token)[0]
    num_users = database_helper.get_number_of_active()
    total_users = database_helper.get_number_of_users()
    user_visits = database_helper.get_user_visits_by_email(email)
    total_visits = database_helper.get_total_visits()
    total_messages = database_helper.get_message_count(email)
    recent_count = [0 for x in range(recent_messages_entries)]
    
    for item in database_helper.get_recent_messages(email, recent_messages_timewindow):
      recent_count[(int(time.time()) - item[2]) // recent_messages_resolution] += 1
    
    user_update = {"current": num_users, "total": total_users}
    visit_update = {"user": user_visits, "total":total_visits}
    message_update = {"messagecount": total_messages, "recent": recent_count}
    data_update = {"users": user_update, "visits": visit_update, "messages": message_update}
    
    return json.dumps({"success": True, "message": "Graph data.", "data": data_update})


def update_user_count():
    num_users = database_helper.get_number_of_active()
    total_users = database_helper.get_number_of_users()
    user_update = {"current": num_users, "total": total_users}
    print "update_usercount()"
    print "num_users: " + str(num_users)
    print "ntotal_users: " + str(total_users)

    for key, value in websockets.items():
        if not value["websocket"].closed :
            value["websocket"].send(json.dumps({"messagetype": "dataUpdate_usercount", "message": "User count data updated.", "data": user_update}))

def update_visit_count():
    total_visits = database_helper.get_total_visits()
    print "update_viscount()"
    print "total_visits: " + str(total_visits)

    for key, value in websockets.items():
        if not value["websocket"].closed :
            visit_update = {"user": database_helper.get_user_visits_by_email(key), "total": total_visits}
            value["websocket"].send(json.dumps({"messagetype": "dataUpdate_visitcount", "message": "Profile visits data updated.", "data": visit_update}))

def update_message_count(email):
    ws = websockets.get(email, None)
    if ws != None :
        message_count = database_helper.get_message_count(email)
        recent_messages = database_helper.get_recent_messages(email, recent_messages_timewindow)
        recent_count = [0 for x in range(recent_messages_entries)]
        for item in recent_messages:
            recent_count[(int(time.time()) - item[2]) // recent_messages_resolution] += 1
        message_update = {"messagecount": message_count, "recent": recent_count}
        if not ws["websocket"].closed :
            ws["websocket"].send(json.dumps({"messagetype": "dataUpdate_messagecount", "message": "Message count data updated.", "data": message_update}))

http_server = WSGIServer(('', 8080), app, handler_class=WebSocketHandler)
http_server.serve_forever()