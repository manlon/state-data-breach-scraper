import json
import os
import boto3
import sqlite3

def lambda_handler(event, context):
  os.chdir('/tmp')
  s3 = boto3.resource('s3')
  bucket = 'ksj-lambda-zips'
  filename = event['filename']
  jsonKey = 'database/' + filename + '.json'
  tmpKey = os.path.join(os.getcwd(), filename + '.db')
  dbKey = 'database/' + filename + '.db'
  obj = s3.Object(bucket_name=bucket, key=jsonKey)
  body = obj.get()['Body'].read().decode('utf-8')
  data = json.loads(body)
  conn = sqlite3.connect(tmpKey)
  conn.execute("CREATE TABLE data_breach_table (state text, entity_name text, dba text, business_address text, business_city text, business_state text, business_zip text, start_date text, end_date text, breach_dates text, reported_date text, published_date text, number_affected text, data_accessed text, notice_methods text, breach_type text, data_source text, letter_url text, url text);")
  conn.execute("CREATE INDEX `idx_state` ON `data_breach_table` (`state` ASC);")
  conn.execute("CREATE INDEX `idx_start_date` ON `data_breach_table` (`start_date` ASC);")
  conn.execute("CREATE INDEX `idx_end_date` ON `data_breach_table` (`end_date` ASC);")
  conn.execute("CREATE INDEX `idx_reported_date` ON `data_breach_table` (`reported_date` ASC);")
  conn.execute("CREATE INDEX `idx_published_date` ON `data_breach_table` (`published_date` ASC);")
  conn.execute("CREATE INDEX `idx_number_affected` ON `data_breach_table` (`number_affected` ASC);")
  conn.execute("CREATE INDEX `idx_breach_type` ON `data_breach_table` (`breach_type` ASC);")
  conn.execute("CREATE INDEX `idx_data_source` ON `data_breach_table` (`data_source` ASC);")
  for item in data['breaches']:
    print(item)
    conn.execute("INSERT INTO data_breach_table ("
      + "state,entity_name,dba,business_address,business_city,business_state,business_zip,start_date,end_date,breach_dates,reported_date,published_date,number_affected,data_accessed,notice_methods,breach_type,data_source,letter_url,url)"
      + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      (
        item["state"],
        item["entity_name"],
        item["dba"],
        item["business_address"],
        item["business_city"],
        item["business_state"],
        item["business_zip"],
        item["start_date"],
        item["end_date"],
        item["breach_dates"] if isinstance(item["breach_dates"], str) else (','.join(str(x) for x in item["breach_dates"])),
        item["reported_date"],
        item["published_date"],
        item["number_affected"],
        item["data_accessed"] if isinstance(item["data_accessed"], str) else (','.join(str(x) for x in item["data_accessed"])),
        item["notice_methods"] if isinstance(item["notice_methods"], str) else (','.join(str(x) for x in item["notice_methods"])),
        item["breach_type"],
        item["data_source"],
        item["letter_url"],
        item["url"]
      )
    )
  conn.commit()
  conn.close()
  
  s3.Object(bucket, dbKey).upload_file(tmpKey)
  return
