# Skill Tree

Skill tree is a web app to visualize skills, motivating people for self-development and supporting the culture of cooperation and knowledge sharing.

**Main features:**
  - Record your current skills and their levels in a visual form
  - Immediately see the self-development options ahead of you (increase awareness of skills, available help & trainings)
  - Inspire people to think about their future & create a personal learning plan with time-framed steps
  - Find people fast with a specific skill & willingness to share their knowledge (enhance collaboration)
  - Making it easy to offer/request training for a specific skill and a specific skill level (build p2p training culture)

##### Planned features

See the [Projects](https://github.com/sicambria/skilltree/projects) tab.

## Development

Skill Tree needs the following components to operate:

* [node.js] - An open-source, cross-platform JavaScript run-time environment that executes JavaScript code outside of a browser.
* [Express] - A web framework for Node.js
* [MongoDB] - A free and open-source cross-platform document-oriented database program. Classified as a NoSQL database program, MongoDB uses JSON-like documents with schemata.
* [Nginx] - A web server which can also be used as a reverse proxy, load balancer, mail proxy and HTTP cache.
* A GNU/Linux distribution, e.g. [Debian] or [Ubuntu].

**Do you want to contribute? Awesome!**

  * You can help us extending the [list of skills](https://github.com/sicambria/skilltree/blob/master/assets/json/skills.json) and [trees](https://github.com/sicambria/skilltree/blob/master/assets/json/trees.json)
  * You can help improving code quality, test coverage and creating new features
  * You can let more people know what SkillTree is & attract more contributors  

**Please read [the contribution guidelines](docs/contribute/CONTRIBUTING.md)**.


##### Code quality

[![Total alerts](https://img.shields.io/lgtm/alerts/g/sicambria/skilltree.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/sicambria/skilltree/alerts/)

[![Maintainability](https://api.codeclimate.com/v1/badges/0315c0b0650106013493/maintainability)](https://codeclimate.com/github/sicambria/skilltree/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0315c0b0650106013493/test_coverage)](https://codeclimate.com/github/sicambria/skilltree/test_coverage)


## Installation

You will need a domain name to install (HTTPS will be configured by default via [Let's Encrypt].)

#### Option 1 - Install script on Debian 9

If you are not familiar with server setup, we recommend to read through the following tutorials:
* Preferred - using Nginx: [How To Secure Nginx with Let's Encrypt on Debian 9]


  * Or if you want to use Apache:
    * [How To Secure Apache with Let's Encrypt on Debian 9]
    * [How To Install the Apache Web Server on Debian 9]


##### Install script (MongoDB, Let's Encrypt, SkillTree & dependencies)
  ```sh
  cd
  mkdir skilltree
  cd skilltree
  wget https://raw.githubusercontent.com/sicambria/skilltree/master/install/skilltree_install_debian9.sh ; chmod +x skilltree_install_debian9.sh ; nano skilltree_install_debian9.sh
  ```


  After running the install script, finalize server configuration.

  For Nginx, edit "sites-available/default" (or your domain specific config file) after the installation. Replace YOUR_DOMAIN.ORG to you own domain name.

  ```sh
  nano /etc/nginx/sites-available/default
  ```


  ```sh
  server {
          listen 443 ssl default_server;
          listen [::]:443 ssl default_server;

          ssl_certificate     /etc/letsencrypt/live/YOUR_DOMAIN.ORG/cert.pem;
          ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.ORG/privkey.pem;

          location / {
                  proxy_pass http://localhost:3000/;
          }
  }

  server {
          listen 80 default_server;
          listen [::]:80 default_server;
          return 301 https://$host$request_uri;
  }
  ```

#### Option 2 - Docker (beta)

##### Build Docker images

  ```sh
  docker build --no-cache -t localhost/skilltree-mongodb:latest ./docker-build/mongodb/
  docker build --no-cache -t localhost/skilltree-nginx:latest ./docker-build/nginx/
  docker build --no-cache -t localhost/skilltree-nodejs:latest ./docker-build/nodejs/
  ```

##### Run Docker containers (in this order!)

  ```sh
  docker run -d -p <IPADDRESS>:27017:27017 localhost/skilltree-mongodb
  docker run -d -p <IPADDRESS>:3000:3000 -e DBADDRESS=<IPADDRESS> localhost/skilltree-nodejs
  docker run -d -e BACKEND=<IPADDRESS> -p 0.0.0.0:80:80 localhost/skilltree-nginx
  ```

## Production use

  * Domain name required, you can register a [free domain with Freenom](https://www.freenom.com)
  * Modify config.js "secret" to be a long and random key
  * Update mongoDB connection. If you want, you can use a [cloud-hosted MongoDB](https://cloud.mongodb.com/) with a GUI editor


### License

BSD License 2.0


[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - https://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [node.js]: <https://nodejs.org>
   [MongoDB]: <https://www.mongodb.com/>
   [Express]: <https://expressjs.com/>
   [Nginx]: <https://www.nginx.com/>
   [Visual Studio Code]: <https://code.visualstudio.com/>
   [Atom]: <https://github.com/atom/atom>
   [Debian]: <https://www.debian.org/>
   [Ubuntu]: <https://www.ubuntu.com/>
   [Let's Encrypt]: <https://letsencrypt.org/>
   [How To Secure Nginx with Let's Encrypt on Debian 9]: <https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-debian-9>
   [How To Secure Apache with Let's Encrypt on Debian 9]: <https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-debian-9>
   [How To Install the Apache Web Server on Debian 9]: <https://www.digitalocean.com/community/tutorials/how-to-install-the-apache-web-server-on-debian-9>
