const { createEmbed } = require('#utils/embed');
const { editOrReply } = require('#utils/message');

const { PERMISSION_GROUPS } = require('#constants');
const { acknowledge } = require('#utils/interactions');

const { InteractionCallbackTypes, ApplicationCommandTypes } = require('detritus-client/lib/constants');

module.exports = {
  name: 'View User Banner',
  type: ApplicationCommandTypes.USER,
  contexts: [
    0,
    1,
    2
  ],
  integrationTypes: [
    1
  ],
  run: async (context, args) => {
    try{
      await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

      let u = await context.client.rest.fetchUser(args.user.id);

      if(!u.banner && !u.accentColor) return editOrReply(context, createEmbed("warning", context, "User doesn't have a banner set."))

      let userBanner = u.bannerUrl ? u.bannerUrl + "?size=4096" : undefined;
      if(!u.banner) userBanner = `https://lh3.googleusercontent.com/akBt-2Rz3efGuxAnOoSJbGuaqxZuRAI7ZUYKBgYZLT4vsk34qVWoAm3o6--RxupzZpayLSRsxO1LCwBECyBT_giQ3xhLMR03z7xngvm4m9ZgQ2Gya1i-3Q%3Dw1920-h677-bc0x0055aa-fcrop64%3D1%2C0000000000010001-rj-b36-c0x${u.accentColor.toString(16)}-s`;

      return editOrReply(context, createEmbed("default", context, {
        image: {
          url: userBanner
        }
      }))
    }catch(e){
      console.log(e)
    }
  },
};