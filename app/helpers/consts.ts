export class Consts {
  
  //DEVELOPMENT activate-dev
  public static PARSE_APPLICATION_ID = "v3NS4xBCONYmIqqtwASz1e3TuX9p1WDZod6dUxA7";
  public static PARSE_CLIENT_KEY = "YB0Po25rU80Z8PpzPQyYCVEzqECZnFQv55lZQakw";
  public static PARSE_JS_KEY = "X0m2dicDJpQ4VGUi6QvKdDgivWsb9iSwaSfmNJa0";
  
  //Messages Class
  public static MESSAGES_CLASS = "Messages";
  //String - message text
  public static MESSAGES_MESSAGE = "message";
  //Boolean - is this message sent by the uesr
  public static MESSAGES_USERSMESSAGE = "usersMessage";
  //Pointer <TreeObjects> - to the treeObject this message points to
  public static MESSAGES_TREEOBJECT = "treeObject";

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
  //String - First Name (all lowercase)
  public static USER_SEARCHABLE_NAMEFIRST = "searchable_nameFirst";
  //String - Last Name (all lowercase)
  public static USER_SEARCHABLE_NAMELAST = "searchable_nameLast";
  //Number - Number of games played
  public static USER_NOOFGAMES = "numGames";

  constructor() {
  }
}
