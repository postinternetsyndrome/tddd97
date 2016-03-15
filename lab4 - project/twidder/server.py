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
from gevent.coros import Semaphore

app = Flask(__name__)
app.debug = True
websockets = {}

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

@app.route('/sign_in/<email>/<password>')    
def sign_in(email, password):
    if '@' in email :
        userdata = database_helper.get_user_by_email(email)
        if userdata != None and userdata[6] == password :
            ws = websockets.get(email, None)
            if ws != None :
                ws["websocket"].send(json.dumps({"messagetype": "forcedLogout", "message": "Forced logout: User signed in from other location."}))
                database_helper.remove_active(database_helper.get_active_by_email(email))
                print "sign_in(): releasing sema for [" + email + "]"
                ws["sema"].release()
                del websockets[email]
                
            if database_helper.get_active_by_email(email) != None :
                database_helper.remove_active_by_email(email)
                
            print "sign_in(): Generating token."
            token = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(36))
            success = database_helper.add_active(token, email)
            print "sign_in(): database_helper.add_active(token, email) = " + str(success)
            if success == True :
                # update_user_count()
                return json.dumps({"success": True, "message": "Successfully signed in.", "data": token})
    return json.dumps({"success": False, "message": "Wrong username or password."})

    
@app.route('/sign_up/<email>/<password>/<firstname>/<familyname>/<gender>/<city>/<country>')
def sign_up(email, password, firstname, familyname, gender, city, country):
    if '@' in email and len(password) > 7 and firstname and familyname and gender and city and country :
        if database_helper.get_user_by_email(email) == None :
            print "ENTERED SIGN_IF_STATEMENT"
            success = database_helper.add_user(email, password, firstname, familyname, gender, city, country)
        else :
            return json.dumps ({"success": False, "message": "User already exist."})           
    else : 
        print "email:'"+email+"' password:'"+password+"' firstname:'"+firstname+"' familyname:'"+familyname+"' gender:'"+gender+"' city:'"+city+"' country:'"+country

        return json.dumps ({"success": False, "message": "Form data missing or incorrect type."})
        
    if success == False :
        return json.dumps ({"success": False, "message": "Error adding user to database."})
    update_user_count()
    return json.dumps({"success": True, "message": "Successfully created a new user."})


@app.route('/sign_out/<token>')
def sign_out(token):
    email = database_helper.get_active(token)
    ret = database_helper.remove_active(token)
    
    if email != None :
        if websockets.get(email, None) != None :
            print "sign_out(): releasing sema for [" + email + "]"
            websockets[email]['sema'].release()
#            del websockets[email]
        if ret :
            update_user_count()
            return json.dumps ({"success": True, "message": "Successfully signed out."})
    else :
        return json.dumps ({"success": False, "message": "You are not signed in."})


@app.route('/change_password/<token>/<oldpass>/<newpass>')
def change_password(token, oldpass, newpass):
    
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


@app.route('/get_user_data_by_email/<token>/<email>')
def get_user_data_by_email(token, email):
    userdata = database_helper.get_user_by_email(email)
        
    if database_helper.get_active(token) == None :
        return json.dumps({"success": False, "message": "You are not signed in."});

    if userdata == None :
        return json.dumps({"success": False, "message": "No such user."})
    else :
        data = {
                "email": userdata[0],
                "firstname": userdata[1],
                "familyname": userdata[2],
                "gender": userdata[3], 
                "city": userdata[4],
                "country": userdata[5]}
        return json.dumps({"success": True, "message": "User data retrieved.", "data": data})
        
@app.route('/get_user_data_by_token/<token>')
def get_user_data_by_token(token):
    email = database_helper.get_active(token)
    if email != None :
        return get_user_data_by_email(token, email)
    else :
        return json.dumps({"success": False, "message": "You are not signed in."});

@app.route('/get_login_status/<token>')
def get_login_status(token):
    email = database_helper.get_active(token)
    if email == None :
        return json.dumps({"success": False, "message": "You are not signed in."})
    return json.dumps({"success": True, "message": "You are signed in."})



@app.route('/get_user_messages_by_email/<token>/<email>')
def get_user_messages_by_email(token, email) :
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


@app.route('/get_user_messages_by_token/<token>')
def get_user_messages_by_token(token) :
    email = database_helper.get_active(token)
    if email == None :
        return json.dumps({"success": False, "message": "You are not signed in."})
    return get_user_messages_by_email(token, email)
    
    
@app.route('/post_message/<token>/<message>/<email>')
def post_message(token, message, email):
    sender = database_helper.get_active(token)
    if sender == None :
        return json.dumps({"success": False, "message": "You are not signed in."})
    if database_helper.get_user_by_email(email) == None :
        return json.dumps({"success": False, "message" : "No such user."})
        
    post_time = int(time.time())
    success = database_helper.add_message(email, sender, post_time, message)
    
    if success == True :
        return json.dumps({"success": True, "message": "Message posted."})
    return json.dumps({"success": False, "message": "Failed to post message."})

@app.route('/websocket/<token>')
def websocket(token):
    if request.environ.get('wsgi.websocket'):
        email = database_helper.get_active(token)
        if (email == None) :
            pass
#            return json.dumps({"success": False, "message": "Your are not signed in."})
        else :
            websocket = request.environ['wsgi.websocket']
            sema = Semaphore(0)
            websockets[email] = {"websocket": websocket, "sema": sema}
            update_user_count()
            print "websocket(): waiting at sema for [" + email + "]"
            sema.acquire()
            del websocket[email]
            print "websocket(): sema for [" + email + "] passed"
#            return json.dumps({"success": True, "message": "Websocket connected."})
    return "websocket(): done"

@app.route('/get_graph_data/<token>')
def get_graph_data(token):
    num_users = database_helper.get_number_of_active()
    total_users = database_helper.get_number_of_users()
    user_update = {"current": num_users, "total": total_users}
    return json.dumps({"success": True, "message": "Update logged in users display.", "data": user_update})

def update_user_count():
    num_users = database_helper.get_number_of_active()
    total_users = database_helper.get_number_of_users()
    user_update = {"current": num_users, "total": total_users}
    print "update_usercount()"
    print "num_users: " + str(num_users)
    print "ntotal_users: " + str(total_users)

    for value in websockets.itervalues():
        value["websocket"].send(json.dumps({"messagetype": "dataUpdate_usercount", "message": "Update logged in users display.", "data": user_update}))

        


#app.run(host=os.getenv('IP', '0.0.0.0'),port=int(os.getenv('PORT', 8080)))

http_server = WSGIServer(('', 8080), app, handler_class=WebSocketHandler)
http_server.serve_forever()