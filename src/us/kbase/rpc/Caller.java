package us.kbase.rpc;

import java.io.Serializable;

import org.codehaus.jackson.annotate.JsonAutoDetect.Visibility;

import java.net.*;
import java.io.*;
import java.util.*;
import org.codehaus.jackson.*;
import org.codehaus.jackson.type.*;
import org.codehaus.jackson.map.ObjectMapper;

public class Caller {

    public String url;
    public URL urlobj;
    ObjectMapper mapper;

    public Caller(String url) throws MalformedURLException
    {
	this.url = url;
	this.urlobj = new URL(url);
	mapper =new ObjectMapper();
    }

    public HttpURLConnection setup_call()
    {
	HttpURLConnection conn;
	try {
	    conn = (HttpURLConnection) urlobj.openConnection();
	    conn.setDoOutput(true);
	    conn.setRequestMethod("POST");

	    return conn;
	} catch (Exception e) {
	    e.printStackTrace();
	    return null;
	}
    }
    public InputStream finish_call(HttpURLConnection conn)
    {
	try {
	    int code = conn.getResponseCode();

	    if (code > 299)
	    {
		String resp = conn.getResponseMessage();
		throw new Exception("Got error " + code + ": " + resp);
	    }

	    return conn.getInputStream();
	} catch (IOException e)
	{
	    System.out.println("E: " + e.getMessage());
	    return null;
	
	} catch (Exception e) {
	    e.printStackTrace();
	    return null;
	}
    }
    public InputStream call(String body)
    {
	HttpURLConnection conn;
	try {
	    conn = (HttpURLConnection) urlobj.openConnection();
	    conn.setDoOutput(true);
	    conn.setRequestMethod("POST");

	    //Send request
	    DataOutputStream wr = new DataOutputStream (conn.getOutputStream ());
	    wr.writeBytes (body);
	    wr.flush ();
	    wr.close ();

	    int code = conn.getResponseCode();

	    if (code > 299)
	    {
		String resp = conn.getResponseMessage();
		throw new Exception("Got error " + code + ": " + resp);
	    }

	    return conn.getInputStream();
	} catch (IOException e)
	{
	    System.out.println("E: " + e.getMessage());
	    return null;
	
	} catch (Exception e) {
	    e.printStackTrace();
	    return null;
	}
    }

    public <ARG, RET> RET jsonrpc_call(String method, ARG arg, Class cls) throws Exception
    {
	// System.out.println("Invoke " + method);
	HttpURLConnection conn = setup_call();

	JsonGenerator g = mapper.getJsonFactory().createJsonGenerator(conn.getOutputStream(), JsonEncoding.UTF8);

	g.writeStartObject();
	g.writeObjectField("params", arg);
	g.writeStringField("method", method);
	g.writeStringField("version", "1.1");
	g.writeEndObject();
	g.close();
	
	int code = conn.getResponseCode();
	String msg = conn.getResponseMessage();

	InputStream istream;
	if (code == 500)
	{
	    istream = conn.getErrorStream();
	}
	else
	{
	    istream = conn.getInputStream();
	}

	// System.out.println("code=" + code + ": " + msg);

	JsonParser parser = mapper.getJsonFactory().createJsonParser(istream);
	JsonToken t= parser.nextToken();
	if (t != JsonToken.START_OBJECT) { throw new Exception("bad parse t=" + t); }
	
	RET res = null;
	String ret_version = null, ret_id = null;
	Map<String, String> ret_error = null;
	while (true)
	{
	    t = parser.nextToken();
	    if (t == JsonToken.END_OBJECT || t == null)
	    {
		break;
	    }
	    
	    if (t != JsonToken.FIELD_NAME){ throw new Exception("bad parse t=" + t); }
	    String field = parser.getCurrentName();
	    // System.out.println(t + " " + field);
	    if (field.equals("result"))
	    {
		t = parser.nextToken();
		// System.out.println("read result " + t + " " + parser.getCurrentName());
		res = (RET) parser.readValueAs(cls);
	    }
	    else if (field.equals("version"))
	    {
		t = parser.nextToken();
		if (t != JsonToken.VALUE_STRING) { throw new Exception("bad parse t=" + t); }
		ret_version = parser.getText();
	    }
	    else if (field.equals("error"))
	    {
		t = parser.nextToken();
		
		if (t != JsonToken.START_OBJECT) { throw new Exception("bad parse t=" + t); }
		
		ret_error = parser.readValueAs(new TypeReference<Map<String, String>>(){});
		// System.out.println("err=" + ret_error);
	    }
	    else if (field.equals("id"))
	    {
		t = parser.nextToken();
		if (t != JsonToken.VALUE_STRING) { throw new Exception("bad parse t=" + t); }
		ret_id = parser.getText();
	    }
	}
	if (ret_error != null)
	{
	    throw new Exception("JSONRPC error received: " + ret_error);
	}
	else if (res == null)
	{
	    throw new Exception("No return found");
	}
	else
	{
	    return res;
	}
    }
}