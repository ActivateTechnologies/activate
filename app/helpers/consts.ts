export class Consts {
  
  //DEVELOPMENT activate-dev
  public static PARSE_APPLICATION_ID = "v3NS4xBCONYmIqqtwASz1e3TuX9p1WDZod6dUxA7";
  public static PARSE_CLIENT_KEY = "YB0Po25rU80Z8PpzPQyYCVEzqECZnFQv55lZQakw";
  public static PARSE_JS_KEY = "X0m2dicDJpQ4VGUi6QvKdDgivWsb9iSwaSfmNJa0";

  public static APP_VERSION = 1;
  
  //Messages Class
  public static MESSAGES_CLASS = "Messages";
  //Pointer <User> pointer to user
  public static MESSAGES_USER = "user";
  //String - message text
  public static MESSAGES_MESSAGE = "message";
  //Boolean - is this message sent by the uesr
  public static MESSAGES_USERSMESSAGE = "usersMessage";
  //Pointer <TreeObjects> - to the treeObject this message points to 
  //or the next tree object this option points to
  public static MESSAGES_TREEOBJECT = "treeObject";
  //Date - Timestamp of when the message was actually created
  public static MESSAGES_TIMESTAMP = "timestamp";
  //String - Type of message, e.g. "dateMessage"
  public static MESSAGES_TYPE = "type";

  //TreeObjects Class
  public static TREEOBJECTS_CLASS = "TreeObjects";
  //Array <Strings> - all messages (of same meaning) for this node
  public static TREEOBJECTS_MESSAGES = "messages";
  //Array <Pointers <TreeObjects>> - points to all the parents of this node (currently unused)
  public static TREEOBJECTS_PARENTS = "parents";
  //Array <Pointers <TreeObjects>> - points to all the children of this node
  public static TREEOBJECTS_CHILDREN = "children";
  //Array <Strings> - messages of all children
  public static TREEOBJECTS_CHILDRENCONNECTORS = "childrenConnectors";
  //String - unique references for certain important nodes
  /*
    'activateRoot' - root node for program
  */
  public static TREEOBJECTS_NOTES = "notes";

  //Users Class
  public static USER_NAME = "name";
  //String - First Name
  public static USER_FIRSTNAME = "firstname";
  //String - Last Name
  public static USER_LASTNAME = "lastname";
  //String - Email
  public static USER_EMAIL = "email";
  //Password - Password
  public static USER_PASSWORD = "password";
  //String - Username
  public static USER_USERNAME = "username";
  //String - User's facebookId
  public static USER_FACEBOOKID = "facebookId";
  //String - First Name (all lowercase)
  public static USER_SEARCHABLE_NAMEFIRST = "searchable_nameFirst";
  //String - Last Name (all lowercase)
  public static USER_SEARCHABLE_NAMELAST = "searchable_nameLast";
  //Number - Number of games played
  public static USER_NOOFGAMES = "numGames";
  //GeoPoint - User's last known location
  public static USER_LASTLOCATION = "lastLocation";
  //Object - stravaData
  public static USER_STRAVADATA = "stravaData";
  //String - stravaAuthorizationCode
  public static USER_STRAVAAUTHORIZATIONCODE = "stravaAuthorizationCode";
  //String - stravaAccessToken
  public static USER_STRAVAACCESSTOKEN = "stravaAccessToken";
  //Number - stravaId
  public static USER_STRAVAID = "stravaId";
  //String - stravaStats
  public static USER_STRAVASTATS = "stravaStats";
  //String - stravaActivitites
  public static USER_STRAVACTIVITIES = "stravaActivities";
  //String - stravaActivititesLastWeek
  public static USER_STRAVACTIVITIESLASTWEEK = "stravaActivitiesLastWeek";
  //Date - the last time user was notified of his/her last walk or activity
  public static USER_LASTNOTIFIEDRECENTACTIVITY = "lastNotifiedRecentActivity";
  //Date - the last time app was opened
  public static USER_LASTOPENED = "lastOpened";


  //HeartData Class
  public static HEARTDATA_CLASS = "HeartData";
  //Pointer <_User>
  public static HEARTDATA_USER = "user";
  //Number - heart beats per min
  public static HEARTDATA_HEARTRATE = "heartRate";
  //Number - 1:Before workout
  public static HEARTDATA_REFERENCE = "reference";

  //Nutrition Class
  public static NUTRITION_CLASS = "Nutrition";
  //Pointer <_User>
  public static NUTRITION_USER = "user";
  //String - Microsoft API Response
  public static NUTRITION_MICROSOFT_RESPONSE = "microsoftResponse";
  //String - Nutritionix API Response
  public static NUTRITION_NUTRITIONIX_INFO = "nutritionixInformation";
  //File - Image uploaded by user
  public static NUTRITION_IMAGE = "image";
  //Pointer<FoodDatabase> - Food object pointer
  public static NUTRITION_FOODOBJECT = "foodObject";
  //Date - Created At
  public static CREATED_AT = "createdAt";

  //Mood Class
  public static MOOD_CLASS = "Mood";
  //Pointer <_User>
  public static MOOD_USER = "user";
  //Number - Mood happiness value
  public static MOOD_HAPPINESS = "happiness";

  //Location Class
  public static LOCATION_DATA_CLASS = "Mood";
  //Pointer <_User>
  public static LOCATION_DATA_USER = "user";
  //Date - Start timestamp of week this data is from
  public static LOCATION_DATA_WEEKSTARTDATE = "weekStartDate";
  //Array - Location objects
  public static LOCATION_DATA_LOCATIONS = "locations";

  constructor() {
  }
}
