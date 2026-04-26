import express from "express";
import pg from "pg";
import { nanoid } from "nanoid";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "url_shortener",
  password: "RiCkY@12345",
  port: "5432",
});

db.connect();

let url = [];
let customcode = [];
let originalurl = [];


db.query("SELECT * FROM urls", (err, res) => {
  if (err) {
    console.log("error executing query", err.stack);
  } else {
    url = res.rows;
    customcode = url.map((x) => x.custom_code);
    originalurl = url.map((x) => x.original_url);
  }
});

app.post("/", (req, res) => {
  let code;
  let short_url;
  let exp_at;
  

  if (req.body.custom_code && !customcode.includes(req.body.custom_code)) {
    code = req.body.custom_code;
    short_url = `http://localhost:3000/${code}`;
  } else if (!req.body.custom_code) {
    code = nanoid(10);
    short_url = `http://localhost:3000/${code}`;
  } else {
    return res.status(409).json({
      error: "Conflict",
      message: "Custom code already exists",
    });
  }

  if (req.body.exp_at) {
    exp_at = req.body.exp_at;
  } else {
    exp_at = null;
  }

  const created_at = new Date().toISOString().split("T")[0];

  db.query(
    "INSERT INTO urls (original_url, custom_code, short_url, clicks, exp_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [req.body.original_url, code, short_url, 0, exp_at, created_at],
    (err, result) => {
      if (err) {
        console.log("insert error", err.stack);
      } else {
        customcode.push(code);
        originalurl.push(req.body.original_url);
        url.push({
          originalurl: req.body.original_url,
          custom_code:code,
          short_url:short_url,
          clicks : 0,
          exp_at : exp_at,
          created_at : created_at
        })
        res.json({
          shorturl: short_url,
          code : code,
          expires_at:exp_at
        });
      }
    },
  );
});

app.get("/urls", (req,res) =>{
  db.query("select original_url,custom_code,clicks from urls",
    (err,result) =>{
      if (err){
        res.status(500).json({
          error: "server error",
          message : "something went wrong"
        });
      }else{
        
        res.json(result.rows);
      }
    }
  );
});


app.get("/:code", (req, res) => {
  const code = req.params.code;
  if (customcode.includes(code)) {
    db.query(
      "SELECT original_url , clicks from urls where custom_code = $1",
      [code],(err, result) => {
        if (err) {
          return res.status(500).json({
            error: "server error",
            message: "something went wrong",
          });
        }else{
          const url = result.rows[0]?.original_url;
          if (!url){return res.status(404).json({message: "url not found"})}; 
          db.query("update urls set clicks = clicks + 1, last_accessed = $1 where custom_code = $2",[new Date().toISOString().split("T")[0],code],
            (err,result) =>{
              if(err) {
                return res.status(500).json({
                  error : "server error",
                  message : "something went wrong"
                });
              }else{
                res.redirect(url);
              }
            }
          )
        
        

        
          
          
        }
      }
    )
  } else {
    res.status(404).json({
      error: "Not found",
      message: "code not found",
    });
  }
});


app.get("/urls/:code", (req,res) => {
  const code = req.params.code;
  db.query("select * from urls where custom_code = $1",[code],
    (err,result) =>{
      if(err){
        return res.status(500).json({
          error: "server error",
          message: "something went wrong"
        });
      }else{
        const details = result.rows[0];
        if(!details){return res.status(404).json({
          message: "url not found"

        });
      }
      res.json(details);
      }
    }
  )
});



app.delete("/urls/:code", (req,res) =>{
  const code = req.params.code;
  db.query("delete from urls where custom_code = $1",[code],
    (err,result)=>{
      if(err){
        res.status(500).json({
          error : "server error",
          message : "something went wrong"
        });
        
      }else{
        if(result.rowCount === 0){
          return res.status(404).json({message : "code not found"})
        }
        res.json({
          message: "Deleted succesfully"
        });
      }
    }
  )
});

app.patch("/urls/:code",(req,res) =>{
  const code = req.params.code;
  const expires_at = req.body.exp_date;
  db.query("update urls set exp_at = $1 where custom_code = $2 ",[expires_at,code],
    (err,result) =>{
      if(err){
        res.status(500).json({
          error:"server error",
          message:"something went wrong"
        });
      }else{
        if(result.rowCount === 0){
          return res.status(404).json({
            message : "code not found"
          })
        }
        res.json({
          message: "Updated succesfully"
        });

      }
    }
  )
});



app.listen(port, () => {
  console.log("server is running");
});
