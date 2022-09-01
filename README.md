<h1>STEP</h1>
<ul>
<li> Install Nodejs</li>
<li> Clone this repository</li>
<li> edit file <b>config.json</b> to connect his</li>
<li> run command in project root directory. </li>
<li> run command  "npm install"
<li> run command  "npm install -g pm2"</li>
<li> run command  "npm install -g nodemon"</li>
<li> run command  "pm2 start ./bin/www -n smart-device-api -i 2"
</ul>
<h1>AUTO BOOT</h1>
<li>npm install --global --production windows-build-tools</li>
<li>npm install -g pm2 pm2-windows-startup</li>
<li>pm2-startup install</li>
<li>pm2 start ./bin/www -n api-2</li>
<li><a href="https://moremeng.in.th/2020/11/how-to-startup-nodejs-when-boot-windows-and-linux.html">อ้างอิง</a></li>

<h1>On Raspberry Pi</h2>
<li>sudo apt-get install nodejs [then sudo node -v , sudo npm -v]</li>
<li>sudo nano /etc/xdg/lxsession/LXDE-pi/autostart</li>
<li>@pm2 start /home/pi/smart_device_api_ii/bin/www -n api -i 2</li>
<h1>TEST</h1>
http://localhost:3000/patient/test