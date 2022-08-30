<h1>STEP</h1>
<ul>
<li> Install Nodejs</li>
<li> Clone this repository</li>
<li> edit file <b>con_db.js</b> to connect his</li>
<li> run command in project root directory. </li>
<li> run command  "npm install"
<li> run command  "npm install -g pm2"</li>
<li> run command  "npm install -g nodemon"</li>
<li> run command  "pm2 start ./bin/www -n smart-device-api -i 2"
</ul>
<h1>On Raspberry Pi</h2>
<li>sudo apt-get install nodejs [then sudo node -v , sudo npm -v]</li>
<li>sudo nano /etc/xdg/lxsession/LXDE-pi/autostart</li>
<li>@pm2 start /home/pi/smart_device_api_ii/bin/www -n api -i 2</li>
<h1>TEST</h1>
http://localhost:3000/patient/test