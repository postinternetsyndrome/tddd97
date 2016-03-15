import sqlite3
import sys
from flask import g

def connect_db():
    return sqlite3.connect('database.db')

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = connect_db()
    return db

# DEBUG AND TESTING

def reset_database(app):
    print "Entered init()"
    with app.app_context():
        print "Getting database..."
        c = get_db()
        print "Success"
        with app.open_resource('database.schema', mode='r') as f:
            print "Reading database.schema"
            c.cursor().executescript(f.read())
            print "Success"
            c.commit()
        print "Database initialization committed"

def helper_test():
    return "helper_test() succeeded"

def get_gender():
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select * from Gender")
    entries = [dict(gender=row[0]) for row in cursor.fetchall()]
    #c.close()
    return entries[0]['gender'] + entries[1]['gender'] + entries[2]['gender']

# ACTUAL STUFF

def get_user_by_email(email):
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select * from Users where email = ?", [email])
    entries = cursor.fetchone()
    print "Return data from (" + str(email) + "): " + str(entries)
    return entries

def get_user_by_token(token):
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select email from Active where token = ?", [token])
    email = cursor.fetchone()
    if email != None :
        return get_user_by_email(email[0])
    else :    
        return None
        
def get_number_of_users():
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select count(*) from Users");
    return cursor.fetchone()[0]

def add_user(email, password, firstname, familyname, gender, city, country):
    c = get_db()
    cursor = c.cursor()
    try:
        c.execute("insert into Users (email, firstname, familyname, gender, city, country, password) values (?,?,?,?,?,?,?)", (email, firstname, familyname, gender, city, country, password))
        c.commit()
    except sqlite3.Error:
        return False
    return True
    
def add_active(token, email):
    c = get_db()
    cursor = c.cursor()
    
    try:
        cursor.execute("insert into Active values (?, ?)", (email, token))
        c.commit()
    except sqlite3.Error as er:
        print er
        return False
    return True
    
def get_number_of_active():
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select count(*) from Active");
    return cursor.fetchone()[0]
    
def get_active(token):
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select email from Active where token = ?", [token])
    email = cursor.fetchone()
    
    if email == None :
        return None
    return email[0]
    
def get_active_by_email(email):
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select token from Active where email = ?", [email])
    token = cursor.fetchone()
    
    if token == None :
        return None
    return token[0]

def remove_active_by_email(email):
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select token from Active where email = ?", [email])
    token = cursor.fetchone()
    
    if token != None :
        cursor.execute("delete from Active where email = ?", [email])
        c.commit()
        return True
    else :
        return False
        
def remove_active(token):
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select email from Active where token = ?", [token])
    email = cursor.fetchone()
    
    if email != None :
        cursor.execute("delete from Active where token = ?", [token])
        c.commit()
        return True
    else :
        return False

def change_password(email, newpass):
    c = get_db()
    cursor = c.cursor()
    
    try:
        cursor.execute("update Users set password=? where email=?", [newpass, email])
        c.commit()
    except sqlite3.Error:
        print "change_password(token, oldpass, newpass): Failed to update password."
        return False
    return True

def get_messages(email) :
    c = get_db()
    cursor = c.cursor()
    cursor.execute("select * from Messages where recipient_email=?", [email])
    return cursor.fetchall()


def add_message(recipient, sender, time, message):
    c = get_db()
    cursor = c.cursor()
    try:
        cursor.execute("insert into Messages (recipient_email, sender_email, time, message) values (?,?,?,?)", (recipient, sender, time, message))
        c.commit()    
    except sqlite3.Error as er:
        print 'er:', er.message
        return False
    return True
    
def close():
    get_db().close()