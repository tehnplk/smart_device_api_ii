<h1>STEP</h1>
<ul>
<li> Install Nodejs</li>
<li> Clone this repository</li>
<li> edit file <b>config.json</b> to connect his</li>
</ul>
<h1>AUTO RUN</h1>
<li>npm install -g pm2 pm2-windows-startup</li>
<li>pm2-startup install</li>
<li>pm2 start ./bin/www -n api</li>
<li>pm2 save</li>
<li>pm2 log (check error)</li>
<li><a href="https://moremeng.in.th/2020/11/how-to-startup-nodejs-when-boot-windows-and-linux.html" target="_blank">อ้างอิง</a></li>

<h1>On Raspberry Pi</h2>
<li>sudo apt-get install nodejs [then sudo node -v , sudo npm -v]</li>
<li>sudo nano /etc/xdg/lxsession/LXDE-pi/autostart</li>
<li>@pm2 start /home/pi/smart_device_api_ii/bin/www -n api</li>
<h1>TEST</h1>
http://localhost:3000/patient/test