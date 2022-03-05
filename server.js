const express=require("express");
const app=express();
const http=require("https");
const request= require("request");
const mongoose= require("mongoose");
//set up is used to  used the input content
const bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
const ejs = require("ejs");
app.set('view engine', 'ejs');

// this api key for open weather map
const apikey="5a8b3046e66ff2488029d5b4f6140a16";
const units="metric";
app.use(express.static("public"));



mongoose.connect("mongodb+srv://Hari2000:Hari2000@cluster0.7meav.mongodb.net/weatherUpdateDB", {useNewUrlParser: true});


const userSchema ={
    email:String,
    fname:String,
    lname:String,
}
const User = new mongoose.model("User", userSchema);


var stateUpdate =[];
var stateTemp=[];
var stateHumidity=[];
var statePressure=[];
var maxtemp;
var maxHumidity;
var maxPressure;
var mintemp;
var minHumidity;
var minPressure;


  function maxValue(list){

       var maxItem ={
           max:list[0].value,
           s:list[0].state,
       }
      
      for(let i=0;i<list.length;i++){
          if( maxItem.max < list[i].value){
             
                maxItem.max=list[i].value;
                maxItem.s=list[i].state;
              
          }
      }
     return  maxItem;
   }
   
  function minValue(list){

    var minItem ={
        min:list[0].value,
       s:list[0].state,
    }
   
   for(let i=0;i<list.length;i++){
       if( minItem.min >list[i].value){
            minItem.min=list[i].value;
            minItem.s=list[i].state;  
       }
   }
  return  minItem;
}


app.get("/",function(req,res){
  
  
   if(stateUpdate.length==0){

    for (let i =0; i<states.length;i++ ) {
      let query = states[i].capital +","+ states[i].state;
    var url="https://api.openweathermap.org/data/2.5/weather?q="+query+"&appid="+apikey+"&units="+units+"";

    http.get(url,function(response){
      response.on("data",function(data){
              
        var weatherdata = JSON.parse(data);  //object we get weather data to makeing into json to js object  
              
              if(weatherdata.cod==200){
  
                const temperature= weatherdata.main.temp;
               
                let weatherDetail ={
                      state:states[i].state,
                      capital:states[i].capital,
                      temp:weatherdata.main.temp,
                      pressure:weatherdata.main.pressure,
                      humidity:weatherdata.main.humidity,
                      weather:weatherdata.weather[0].description,
                      icon:"http://openweathermap.org/img/wn/"+weatherdata.weather[0].icon +"@2x.png"
                      
                }
                 let eachTemp={
                  state:states[i].state,
                  value:weatherdata.main.temp,
                 }
                 let eachHumidity={
                  state:states[i].state,
                  value:weatherdata.main.humidity,
                 }
                 let eachPressure={
                  state:states[i].state,
                  value:weatherdata.main.pressure,
                 }
                 
                stateUpdate.push(weatherDetail);
                stateTemp.push(eachTemp);
                stateHumidity.push(eachHumidity);
                statePressure.push(eachPressure);

                  maxtemp =maxValue(stateTemp);
                  mintemp =minValue(stateTemp);
                  maxPressure =maxValue(statePressure);
                  minPressure =minValue(statePressure);
                  maxHumidity =maxValue(stateHumidity);
                  minHumidity =minValue(stateHumidity);

               } 
     })  

    });
  }
}
   res.render("index",{weatherList:stateUpdate,hottest:maxtemp,moist:maxHumidity,hightPressure:maxPressure,coldest:mintemp,dry:minHumidity,lowPressure:minPressure});
 
});

 var query;
 var descr;
 var temperature;
 var imageURL;
app.get("/Query",function(req,res){
  res.render("query",{place:query,description:descr,temp:temperature,imgURL:imageURL});
});
app.post("/",function(req,res){
     
   if(req.body.whichPost=="query"){
      console.log("query post clicked");

      query =req.body.cityname;
   
        var url="https://api.openweathermap.org/data/2.5/weather?q="+query+"&appid="+apikey+"&units="+units+"";
        
        // http request to external server
         // this is help to get data request to the server
         http.get(url,function(response){
          console.log(response.statusCode);
         
           if(response.statusCode!=200){
             res.redirect('/');
           }else{
    
              // hold the data form reponse through http request    
              response.on("data",function(data){
                // console.log(data); //give in hea decimal format
                 var weatherdata = JSON.parse(data);  //object we get weather data to makeing into json to js object
             //     console.log(weatherdata);  //print the all datail of API
                 temperature= weatherdata.main.temp;
                 console.log(weatherdata);
                 console.log(temperature);
                 console.log("Whather description");
                 descr=weatherdata.weather[0].description;
                 console.log(descr);
                 const icon=weatherdata.weather[0].icon;
                 imageURL="http://openweathermap.org/img/wn/"+icon+"@2x.png" 
                
                 res.redirect('/Query');
          
         
             })    
    
           }
    });

   }else if(req.body.whichPost=="subscribe"){


      console.log("subscribe post clicked");

      const firstname =req.body.fname ;
      const secondname=req.body.lname ;
      const useremail= req.body.email;
       console.log(firstname);
       console.log(secondname);
       console.log(useremail);
      const newUser= new User({
          email:useremail,
          fname:firstname,
          lname:secondname
      });
    
  
      
      const data ={
          members:[
              {
              email_address:useremail,
              email_type:"text",
              status:"subscribed",
              merge_fields:{
                  FNAME: firstname,
                  LNAME: secondname
              }
              }
          ]
              
      };
      
      // this will change this to flat pack form(int string form)
      // this is the data we will send to the mailchip server
      const jsonData =JSON.stringify(data);
      
      const url ="https://us14.api.mailchimp.com/3.0/lists/d5d795d05c";
      
      const  options = {
            method:"POST",
            auth:"Harikishan:5481f1490a42ca7d6807f943b07cbd77-us14",
        };
      
        User.findOne({email:req.body.email},function(err,foundUser){
          if(err){
              console.log(err);
          }else{
               if(foundUser){
               console.log("user is already subscribe");
               res.redirect('/');
  
               }else{
                 
              newUser.save();
  
         const  request=  http.request(url,options,function(response){
        
               if(response.statusCode===200){
                      res.redirect('/');
                  }
                 else  res.sendFile(__dirname +"/failure.html");
                
           // response getting on to use the data send by server regarding status,error
               response.on("data",function(data){
                    const d=JSON.parse(data);
                      console.log(d);
                  
                  });
              });   
              request.write(jsonData); 
              request.end();          
            }
          }
       });


   }

    console.log("post has beem done");
  
      
});


app.listen(3000,function(){
    console.log("server is running on port 3000");
});


states =[
   { capital:"Amaravati",
    state:"Andhra Pradesh"},
    { capital:"Itanagar",
    state:"Arunachal Pradesh"},
     { capital:"Dispur",
    state:"Assam"},
     { capital:"Patna",
    state:"Bihar"},
    { capital:"Raipur",
    state:"Chhattisgarh"},
    { capital:"Panaij",
    state:"Goa"},
    { capital:"Gandhinagar",
    state:"Gujarat"},
    { capital:"Chandigarh",
    state:" Haryana"},
    { capital:"Shimla",
    state:"Himachal Pradesh"},
    { capital:"Ranchi",
    state:"Jharkhand"},
    { capital:"Bengaluru",
    state:"Karnataka"},
    { capital:"Thiruvananthapuram",
    state:"Kerala"},
    { capital:"Bhopal",
    state:"Madhya Pradesh"},
    { capital:"Mumbai",
    state:"Maharashtra"},
    { capital:"Imphal",
    state:"Manipur"},
    { capital:"Shillong",
    state:"Meghalaya"},
    { capital:"Aizawl",
    state:"Mizoram"},
    { capital:"Kohima",
    state:"Nagaland	"},
    { capital:"baneswarBhu",
    state:"Odisha	"},
    { capital:"Chandigarh",
    state:"Punjab"},
    { capital:"Jaipur",
    state:"Rajasthan"},
    { capital:"Gangtok",
    state:"Sikkim"},
    { capital:"Chennei",
    state:"Tamil Nadu"},
    { capital:"Hyderabad",
    state:"Telangana"},
    { capital:"Agartala",
    state:"Tripura"},
    { capital:"Lucknow",
    state:"Uttar Pradesh"},
    { capital:"Dehradun",
    state:"Uttarakhand"},
    { capital:"Kolkata",
    state:"West Bengal"},
    { capital:"Port Blair",
    state:"Andaman and Nicobar Islands"},
    { capital:"Chandigarh",
    state:"Chandigarh"},
    { capital:"Daman",
    state:"Dadra & Nagar Haveli and Daman & Diu"},
    { capital:"New Delhi",
    state:"Delhi"},
    { capital:"Srinagar",
    state:"Jammu and Kashmir"},
    { capital:"Kavaratti",
    state:"Lakshadweep"},
    { capital:"Pondicherry",
    state:"Puducherry"},
    { capital:"Leh",
    state:"Ladakh"}   
  
];



 // api key 5481f1490a42ca7d6807f943b07cbd77-us14 using nit gmail
 // audience ID: d5d795d05c


 // username: Hari2000
 // password: Hari2000