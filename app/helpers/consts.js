"use strict";
var Consts = (function () {
    function Consts() {
    }
    //DEVELOPMENT activate-dev
    Consts.PARSE_APPLICATION_ID = "v3NS4xBCONYmIqqtwASz1e3TuX9p1WDZod6dUxA7";
    Consts.PARSE_CLIENT_KEY = "YB0Po25rU80Z8PpzPQyYCVEzqECZnFQv55lZQakw";
    Consts.PARSE_JS_KEY = "X0m2dicDJpQ4VGUi6QvKdDgivWsb9iSwaSfmNJa0";
    Consts.APP_VERSION = 1;
    //Messages Class
    Consts.MESSAGES_CLASS = "Messages";
    //Pointer <User> pointer to user
    Consts.MESSAGES_USER = "user";
    //String - message text
    Consts.MESSAGES_MESSAGE = "message";
    //Boolean - is this message sent by the uesr
    Consts.MESSAGES_USERSMESSAGE = "usersMessage";
    //Pointer <TreeObjects> - to the treeObject this message points to 
    //or the next tree object this option points to
    Consts.MESSAGES_TREEOBJECT = "treeObject";
    //Date - Timestamp of when the message was actually created
    Consts.MESSAGES_TIMESTAMP = "timestamp";
    //String - Type of message, e.g. "dateMessage"
    Consts.MESSAGES_TYPE = "type";
    //TreeObjects Class
    Consts.TREEOBJECTS_CLASS = "TreeObjects";
    //Array <Strings> - all messages (of same meaning) for this node
    Consts.TREEOBJECTS_MESSAGES = "messages";
    //Array <Pointers <TreeObjects>> - points to all the parents of this node (currently unused)
    Consts.TREEOBJECTS_PARENTS = "parents";
    //Array <Pointers <TreeObjects>> - points to all the children of this node
    Consts.TREEOBJECTS_CHILDREN = "children";
    //Array <Strings> - messages of all children
    Consts.TREEOBJECTS_CHILDRENCONNECTORS = "childrenConnectors";
    //String - unique references for certain important nodes
    /*
      'activateRoot' - root node for program
    */
    Consts.TREEOBJECTS_NOTES = "notes";
    //Users Class
    Consts.USER_NAME = "name";
    //String - First Name
    Consts.USER_FIRSTNAME = "firstname";
    //String - Last Name
    Consts.USER_LASTNAME = "lastname";
    //String - Email
    Consts.USER_EMAIL = "email";
    //Password - Password
    Consts.USER_PASSWORD = "password";
    //String - Username
    Consts.USER_USERNAME = "username";
    //String - User's facebookId
    Consts.USER_FACEBOOKID = "facebookId";
    //String - First Name (all lowercase)
    Consts.USER_SEARCHABLE_NAMEFIRST = "searchable_nameFirst";
    //String - Last Name (all lowercase)
    Consts.USER_SEARCHABLE_NAMELAST = "searchable_nameLast";
    //Number - Number of games played
    Consts.USER_NOOFGAMES = "numGames";
    //GeoPoint - User's last known location
    Consts.USER_LASTLOCATION = "lastLocation";
    //Object - stravaData
    Consts.USER_STRAVADATA = "stravaData";
    //String - stravaAuthorizationCode
    Consts.USER_STRAVAAUTHORIZATIONCODE = "stravaAuthorizationCode";
    //String - stravaAccessToken
    Consts.USER_STRAVAACCESSTOKEN = "stravaAccessToken";
    //Number - stravaId
    Consts.USER_STRAVAID = "stravaId";
    //String - stravaStats
    Consts.USER_STRAVASTATS = "stravaStats";
    //String - stravaActivitites
    Consts.USER_STRAVACTIVITIES = "stravaActivities";
    //String - stravaActivititesLastWeek
    Consts.USER_STRAVACTIVITIESLASTWEEK = "stravaActivitiesLastWeek";
    //Date - the last time user was notified of his/her last walk or activity
    Consts.USER_LASTNOTIFIEDRECENTACTIVITY = "lastNotifiedRecentActivity";
    //Date - the last time app was opened
    Consts.USER_LASTOPENED = "lastOpened";
    //HeartData Class
    Consts.HEARTDATA_CLASS = "HeartData";
    //Pointer <_User>
    Consts.HEARTDATA_USER = "user";
    //Number - heart beats per min
    Consts.HEARTDATA_HEARTRATE = "heartRate";
    //Number - 1:Before workout
    Consts.HEARTDATA_REFERENCE = "reference";
    //Nutrition Class
    Consts.NUTRITION_CLASS = "Nutrition";
    //Pointer <_User>
    Consts.NUTRITION_USER = "user";
    //String - Microsoft API Response
    Consts.NUTRITION_MICROSOFT_RESPONSE = "microsoftResponse";
    //String - Nutritionix API Response
    Consts.NUTRITION_NUTRITIONIX_INFO = "nutritionixInformation";
    //File - Image uploaded by user
    Consts.NUTRITION_IMAGE = "image";
    //Pointer<FoodDatabase> - Food object pointer
    Consts.NUTRITION_FOODOBJECT = "foodObject";
    //Date - Created At
    Consts.CREATED_AT = "createdAt";
    //Mood Class
    Consts.MOOD_CLASS = "Mood";
    //Pointer <_User>
    Consts.MOOD_USER = "user";
    //Number - Mood happiness value
    Consts.MOOD_HAPPINESS = "happiness";
    //Location Class
    Consts.LOCATION_DATA_CLASS = "Mood";
    //Pointer <_User>
    Consts.LOCATION_DATA_USER = "user";
    //Date - Start timestamp of week this data is from
    Consts.LOCATION_DATA_WEEKSTARTDATE = "weekStartDate";
    //Array - Location objects
    Consts.LOCATION_DATA_LOCATIONS = "locations";
    return Consts;
}());
exports.Consts = Consts;
