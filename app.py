from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash


# =====================================================
# FITQUEST FLASK BACKEND
# =====================================================

app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend",
    static_url_path=""
)

CORS(app)


# =====================================================
# MYSQL CONNECTION
# =====================================================

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Root@123",
        database="fitquest"
    )


# =====================================================
# HOME
# =====================================================

@app.route("/")
def home():
    return render_template("index.html")


# =====================================================
# DATABASE TEST
# =====================================================

@app.route("/api/db-test")
def database_test():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")
        database = cursor.fetchone()

        return jsonify({
            "status": "success",
            "database": database[0],
            "message": "MySQL connection successful ⚡"
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# REGISTER
# =====================================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    # Validation
    if not username or not email or not password:
        return jsonify({
            "status": "error",
            "message": "All fields are required."
        }), 400

    if len(password) < 6:
        return jsonify({
            "status": "error",
            "message": "Password must contain at least 6 characters."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check existing user
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE username = %s OR email = %s
            """,
            (username, email)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "status": "error",
                "message": "Username or email already exists."
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Create user
        cursor.execute(
            """
            INSERT INTO users
            (username, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (username, email, password_hash)
        )

        user_id = cursor.lastrowid

        # Create initial stats
        cursor.execute(
            """
            INSERT INTO user_stats
            (
                user_id,
                total_distance,
                total_energy,
                total_xp,
                current_streak,
                quests_completed
            )
            VALUES
            (%s, 0, 0, 0, 0, 0)
            """,
            (user_id,)
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Account created successfully 🎉",
            "user_id": user_id
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                username,
                email,
                password_hash
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401

        # Check password
        if not check_password_hash(
            user["password_hash"],
            password
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401

        return jsonify({
            "status": "success",
            "message": "Login successful 🎉",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }), 200

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# DASHBOARD
# =====================================================

@app.route("/api/dashboard/<int:user_id>")
def dashboard(user_id):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                u.id,
                u.username,
                u.email,
                s.total_distance,
                s.total_energy,
                s.total_xp,
                s.current_streak,
                s.quests_completed
            FROM users u
            JOIN user_stats s
                ON u.id = s.user_id
            WHERE u.id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404

        return jsonify({
            "status": "success",
            "user": user
        }), 200

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# QUEST COMPLETION
# =====================================================

@app.route("/api/quest/complete", methods=["POST"])
def complete_quest():

    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    activity = data.get("activity")
    distance = data.get("distance")
    target = data.get("target")

    # -------------------------------------------------
    # VALIDATION
    # -------------------------------------------------

    if user_id is None:
        return jsonify({
            "status": "error",
            "message": "User ID is required."
        }), 400

    if not activity:
        return jsonify({
            "status": "error",
            "message": "Activity is required."
        }), 400

    if distance is None:
        return jsonify({
            "status": "error",
            "message": "Distance is required."
        }), 400

    try:

        user_id = int(user_id)
        distance = float(distance)

    except (ValueError, TypeError):

        return jsonify({
            "status": "error",
            "message": "Invalid quest data."
        }), 400

    # -------------------------------------------------
    # VALID ACTIVITIES
    # -------------------------------------------------

    valid_activities = {
        "Walking": 2,
        "Running": 3.0,
        "Cycling": 5.0,
        "Sports": 1.0,
        "Exercise": 1.0
    }

    if activity not in valid_activities:
        return jsonify({
            "status": "error",
            "message": "Invalid activity."
        }), 400

    # Always use server-side target
    expected_target = valid_activities[activity]
    target = expected_target

    # -------------------------------------------------
    # DISTANCE VALIDATION
    # -------------------------------------------------

    if distance < target:

        return jsonify({
            "status": "error",
            "message": (
                f"Quest target not reached. "
                f"Required: {target:.2f} KM, "
                f"Completed: {distance:.2f} KM."
            )
        }), 400

    # Protect database from unrealistic values
    if distance > 1000:

        return jsonify({
            "status": "error",
            "message": "Invalid distance value."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------
        # CHECK USER
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                username
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:

            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404

        # -------------------------------------------------
        # GET CURRENT STATS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                total_distance,
                total_energy,
                total_xp,
                current_streak,
                quests_completed
            FROM user_stats
            WHERE user_id = %s
            FOR UPDATE
            """,
            (user_id,)
        )

        stats = cursor.fetchone()

        if not stats:

            return jsonify({
                "status": "error",
                "message": "User statistics not found."
            }), 404

        # -------------------------------------------------
        # REWARDS
        # -------------------------------------------------

        energy_reward = 100
        xp_reward = 50
        streak_reward = 1

        # -------------------------------------------------
        # CALCULATE NEW STATS
        # -------------------------------------------------

        new_distance = (
            float(stats["total_distance"] or 0)
            + distance
        )

        new_energy = (
            int(stats["total_energy"] or 0)
            + energy_reward
        )

        new_xp = (
            int(stats["total_xp"] or 0)
            + xp_reward
        )

        new_streak = (
            int(stats["current_streak"] or 0)
            + streak_reward
        )

        new_quests = (
            int(stats["quests_completed"] or 0)
            + 1
        )

        # -------------------------------------------------
        # UPDATE DATABASE
        # -------------------------------------------------

        cursor.execute(
            """
            UPDATE user_stats
            SET
                total_distance = %s,
                total_energy = %s,
                total_xp = %s,
                current_streak = %s,
                quests_completed = %s
            WHERE user_id = %s
            """,
            (
                new_distance,
                new_energy,
                new_xp,
                new_streak,
                new_quests,
                user_id
            )
        )

        connection.commit()

        # -------------------------------------------------
        # SUCCESS
        # -------------------------------------------------

        return jsonify({
            "status": "success",
            "message": "Quest completed successfully 🏆",
            "user_id": user_id,
            "activity": activity,
            "distance_added": round(distance, 2),
            "energy_added": energy_reward,
            "xp_added": xp_reward,
            "streak_added": streak_reward,
            "quest_added": 1,
            "stats": {
                "total_distance": round(new_distance, 2),
                "total_energy": new_energy,
                "total_xp": new_xp,
                "current_streak": new_streak,
                "quests_completed": new_quests
            }
        }), 200

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": f"Could not save quest: {str(error)}"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# RUN SERVER
# =====================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )