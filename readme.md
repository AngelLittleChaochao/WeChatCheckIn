## Introduction
This is a wechat project. It is for user to mark this tasks every day. When user finishes his/her task, he/she marks on wechat and then wechat will notify other users that the user is finished his/her task.

If someone doesn't finished his/her task, they can do some punishment offline. Later on, more functions will be added.

![image](./sample.jpg  =300x)

## Using this Repository
* Install [Node.js](https://nodejs.org/en/)
* Install [Redis](http://redis.io/download) or find a redis to use
* Install [ngrok](https://ngrok.com/download) if you don't have a public server. ngrok will help proxy wechat message to your server.

## How to use this Repository
1. Edit your config information in **env_git** file.  
	Set your *wechat account* information and *redis* information in **env_git** file.
2. Install packages. 

	```
	npm install
	``` 
3. Add users you want to notify when "打卡" is clicked.  
	This step should be automatically set, but now I haven't added this function. For test, you can set users information by running the test in **lib/test/msg-machine/UserManagerTest.js**, but you should change the user id to yours first.

	```
	//you can also set mocha to global	
	node_modules/mocha/bin/mocha lib/test/msg-machine/UserManagerTest.js
	```
4. Run the server.

	```
	source env_git; node app.js
	```
5. Test server.

	```
	//change FromUserName field in menu.xml to your own user id.	cd moch_client
	node send.js menu.xml
	```
	
## Connect to WeChat Account

If you have a public server, config **YOUR_PUBLIC_SERVER/msg** to receive WeChat message, otherwise using the following method.

1. ngrok to proxy messages.

	```
	// proxy your server port
	$>ngrok http 3456
	ngrok by @inconshreveable                                             (Ctrl+C to quit)                                                                              
	Tunnel Status                 online                                                  
	Update                        update available (version 2.1.14, Ctrl-U to update)     
	Version                       2.1.3                                                   
	Region                        United States (us)                                      
	Web Interface                 http://127.0.0.1:4040                                   
	Forwarding                    http://6e0771c0.ngrok.io -> localhost:3456              
	Forwarding                    https://6e0771c0.ngrok.io -> localhost:3456             
                                                                                      
	Connections                   ttl     opn     rt1     rt5     p50     p90             
                              171     0       0.00    0.00    0.40    0.42  
	```
	After you run the command, it will show the public address to forward message, the following example is **http://6e0771c0.ngrok.io**, so config receive message url to **http://6e0771c0.ngrok.io/msg**.

2. Start server

	```
	source env_git; node app.js
	```
	
## Technical Learning
1. Redis  
	Redis is a fast cache. Here we use **SortedSet** to filter duplicated message, **HashSet** to store user information.
2. Token  
	We use token to access WeChat API, how about manage the token distributely. Here we also use redis to store the token value.
	
## WeChat API
WeChat API can be found [here](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1474632113_xQVCl&token=&lang=zh_CN)  



