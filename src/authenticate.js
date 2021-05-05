const autheticate = async (resolve, root, args, context, info) => {
    //console.log("context >>> ", context.request.get("Authorization"));
    //const auth = context.request.get("Authorization");
    /*var aboutMyHero = {
      app: "myherodelivery",
      env: "local",
      iat: 1516239022,
    };
    const token = jwt.sign(aboutMyHero, process.env.JWT_SECRET_LIVE_MOBILE);
    console.log("process.env.JWT_SECRET >>> ", process.env.JWT_SECRET_LIVE_MOBILE);
    console.log("signed token >>> ", token);*/
    var token = context.request !== null ? context.request.get("Authorization"):null;//'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJteWhlcm9kZWxpdmVyeSIsImlhdCI6MTUxNjIzOTAyMn0.UvyBlC2kUOUuYOuq1aWCV7SX8KrtOOUIrrUetVeia44';
    /*try {
      switch (process.env.APP_ENV) {
        case 'live':    
          verifiedToken = jwt.verify(token, process.env.JWT_SECRET_LIVE);
          console.log("verified token (live) >>> ", verifiedToken);
          break;
        case 'uat':
          verifiedToken = jwt.verify(token, process.env.JWT_SECRET_UAT);
          console.log("verified token (uat) >>> ", verifiedToken);
          break;
        case 'local':
          verifiedToken = jwt.verify(token, process.env.JWT_SECRET_LOCAL);
          console.log("verified token (dev) >>> ", verifiedToken); 
          break;
        default:       
          // return new AuthenticationError("Not authorised");
          var errorDetails = process.env.APP_ENV+" is not a valid environment variable.";
          console.log(errorDetails);
          var error = {details: errorDetails, type: "Q", functionName: "middleware"};
          await insertErrorLog(error);
          throw new Error(errorDetails);
      }
    } catch (e) {
      //This is good if somebody tries to use our queries/mutation with wrong token
      var queryMutationVars = [];
      if (context.request.body.variables !== undefined) {
          Object.entries(
            context.request.body.variables
          ).forEach(([key, value]) =>
              queryMutationVars.push(key.toString()+":"+value.toString())
          );
      }

      var errorDetails = "VAR: ("+queryMutationVars.toString()+")"+
        " -> AUTHORIZATION: "+context.request.get("Authorization")+
        " -> FUNCTION: "+context.request.body.query.toString();
      console.log(errorDetails);   
      var error = {details: errorDetails, type: "Q", functionName: "hack"};
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }*/

    const result = await resolve(root, args, context, info);
    console.log("result >>> ", result);
    return result;
};