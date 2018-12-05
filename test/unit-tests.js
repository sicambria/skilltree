var expect = require("chai").expect;
var tools = require("../pbkdf2");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

describe("hashPassword() and verifyPassword()", function(){
    it("Should hash the password and decode it correctly", function(){

        var hashedPW = tools.hashPassword("VeryPassword");
        var result = tools.verifyPassword("VeryPassword", hashedPW)

        expect(result).to.equal(true);
    });
} )

describe("API '/userdata'", function(){
    it("Should succesfully register a user", function(){

                var httpRequest = new XMLHttpRequest();
				httpRequest.open('POST', '/registration', true);
				httpRequest.setRequestHeader('Content-type', 'application/json');
				httpRequest.responseType = "json";
				httpRequest.onreadystatechange = function() {
		    		if(httpRequest.readyState == 4 && httpRequest.status == 200) {
                    
                        //TEST
                        expect(httpRequest.response.success).to.equal(true);	
						} 
					}
				

				httpRequest.send(
					JSON.stringify({
						username: "testuser",
						password: "testpassword",
						email: "test@email.com",
						focusArea: "Engineering",
						willingToTeach: true
					})
				);


        
    })

})


