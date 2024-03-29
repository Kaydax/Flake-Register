"use strict";

const Base = require('../../Configuration'); 

class Email extends Base{
    constructor(request, response, database) {
        super();
        this.request = request; 
        this.response = response;  
        this.database = database;
    }

    async handle(user){
        let id = Math.random().toString(26).slice(2);
        if(this.activation)
            await this.send_mail(user, id);
            await this.database.execute('activation', `create`, ({PenguinID: user.ID, ActivationKey: id}));
    }

    async execute(){
        let id = this.request.params.value;
        let _data = this.displays.find('/link_not_found');
        let user = await this.database.execute('activation', `findOne`, {where: {ActivationKey: `${id}`}});
        if(!user)
            return this.response.render(_data.page, _data.ejs);

        let query = JSON.parse(`{"Active":1, "ID":"${user.PenguinID}"}`);
        await this.database.update('penguin', query);
        await this.database.execute('activation', `destroy`, {where: {ActivationKey: `${id}`}});
        this.log.success(`A user (PenguinID: ${user.PenguinID}) has just activated their account via email.`)
        let data = this.displays.find('/activated');
        this.response.render(data.page, data.ejs);

    }

    async send_mail(user, id){
        try{
            let transporter = await this.nodemailer.createTransport({service: 'Gmail', auth: {user: this.gmail_user, pass: this.gmail_pass}});
            await transporter.sendMail({to: user.Email, subject: `Activate your account for ${this.cpps_name}`, text: `Thank you for registering to ${this.cpps_name}. Please head over to http://${this.sub_domain}/activate/${id} to activate your penguin.`, }); /* Change to a more professional written email if you like */
        }
        catch(e){
            this.crash(user);
        }
    }

    crash(user){
        this.log.crash(`Flake is unable to connect to gmail, here are some potential issues:`)
        this.log.crash(`1. incorrect gmail details.`)
        this.log.crash(`2. less secure apps is not enabled in the security settings of the gmail/google account.`)
        this.log.crash(`Please set activation to 0 in Configuration.js until you find a fix.`)
        this.log.crash(`You may also want to either delete or manually activate (through the database) ${user.Username}'s account.`)
    }

}

module.exports = Email;