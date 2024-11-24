import sqlite3
import bcrypt
import logging

logger = logging.getLogger(__name__)

class AuthDAO:
    def __init__(self, database):
        self.database = database
        self.connection = sqlite3.connect(database, check_same_thread=False)
        self.cursor = self.connection.cursor()

    def create_user(self, user_data):
        try:
           
            self.cursor.execute("""
                INSERT INTO users (username, email, hashed_password, user_type, created_at, account_status)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1) """, 
            (user_data["username"], user_data["email"], user_data["password"], user_data["user_type"]))

            return self.cursor.lastrowid, None
        
        except sqlite3.IntegrityError as e:
            if "username" in str(e):
                return None, "Username already present"
            elif "email" in str(e):
                return None, "Email already present"
            return None, str(e)
        
        except Exception as e:
            return None, str(e)

    def revoke_user_refresh_token(self, user_id):
        try:
            self.cursor.execute("DELETE FROM refresh_tokens WHERE user_id = ?", (user_id,))

            return True
        
        except Exception as e:
            return False
    
    def verify_credentials(self, username, password):
        try:
            self.cursor.execute(
                """SELECT id, username, hashed_password, user_type, account_status 
                   FROM users WHERE username = ?""",
                (username,)
            )
            user = self.cursor.fetchone()
            
            if not user:
                logger.info(f"No user found for username: {username}")
                return None, "Invalid credentials"
            
            logger.debug(f"Found user record: {user}")
            user_id, username, db_password_hash, user_type, account_status = user
            
            # user is banned
            if account_status == 0:
                logger.info(f"Banned account attempt: {username}")
                return None, "Banned account"
            
            try:
                # Ensure password and hash are properly encoded
                password_bytes = password.encode('utf-8')
                hash_bytes = db_password_hash.encode('utf-8') if isinstance(db_password_hash, str) else db_password_hash
                
                # Verify password
                if bcrypt.checkpw(password_bytes, hash_bytes):
                    logger.info(f"Successful authentication for user: {username}")
                    return {
                        "user_id": user_id,
                        "username": username,
                        "user_type": user_type
                    }, None
                else:
                    logger.info(f"Invalid password for user: {username}")
                    return None, "Invalid credentials"
                    
            except ValueError as ve:
                logger.error(f"Password verification error: {str(ve)}")
                return None, "Invalid password format"
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            return None, f"Authentication error: {str(e)}"

    def store_refresh_token(self, token, user_id, expires_at):
        self.cursor.execute(
            "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at)
        )

    def verify_refresh_token(self, token):
        self.cursor.execute(
            """SELECT user_id FROM refresh_tokens 
               WHERE token = ? AND expires_at > CURRENT_TIMESTAMP""",
            (token,)
        )
        result = self.cursor.fetchone()
        return result[0] if result else None

    def get_user_by_id(self, user_id):
        """Get user details by ID"""
        try:
            self.cursor.execute(
                """SELECT id, username, email, user_type, account_status, created_at, last_login 
                   FROM users WHERE id = ?""", 
                (user_id,)
            )
            user = self.cursor.fetchone()
            if user:
                return {
                    "id": user[0],
                    "username": user[1],
                    "email": user[2],
                    "user_type": user[3],
                    "account_status": user[4],
                    "created_at": user[5],
                    "last_login": user[6]
                }, None
            return None, "User not found"
        except Exception as e:
            return None, str(e)