CREATE MIGRATION m176csrxxlptndksvksvyfwwr4lu6zzisufauagvf3vnvnz6laiika
    ONTO initial
{
  CREATE TYPE default::Comment {
      CREATE LINK parentComment: default::Comment;
      CREATE MULTI LINK replies := (.<parentComment[IS default::Comment]);
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY text: std::str;
  };
  CREATE TYPE default::User {
      CREATE REQUIRED PROPERTY age: std::int32;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  ALTER TYPE default::Comment {
      CREATE REQUIRED LINK author: default::User;
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK comments := (.<author[IS default::Comment]);
  };
  CREATE TYPE default::Post {
      CREATE REQUIRED LINK author: default::User;
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY published: std::bool;
      CREATE REQUIRED PROPERTY title: std::str;
  };
  ALTER TYPE default::Comment {
      CREATE LINK parentPost: default::Post;
  };
  ALTER TYPE default::Post {
      CREATE MULTI LINK comments := (.<parentPost[IS default::Comment]);
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK posts := (.<author[IS default::Post]);
  };
  CREATE TYPE default::UserSession {
      CREATE REQUIRED LINK user: default::User;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK sessions := (.<user[IS default::UserSession]);
  };
};
