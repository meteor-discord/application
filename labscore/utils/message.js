const { Permissions, MessageFlags } = require("detritus-client/lib/constants")
const { basecamp, formatErrorMessage } = require("../logging")
const { COLORS, MESSAGE_BLOCK_REASONS, EOS_NOTICE_URL, EOS_NOTICE_TIMESTAMP, EOS_ENABLED} = require("#constants")
const { icon, link } = require("./markdown")
const {timestamp} = require("#utils/markdown");

module.exports.editOrReply = function(context, message, disableReference = false){
  // Apply message_reference
  if(!message.content && !message.embed && !message.embeds && !message.components && !message.files && typeof(message) == "object") message = {embeds: [message]};
  else if(typeof(message) == "string") message = { content: message };
  if(!message.message_reference && !disableReference) message.reference = true
  // Disable mentions
  if(!message.allowedMentions) message.allowedMentions = {parse: [], repliedUser: false}

  // Apply eos notice to all responses
  if(EOS_ENABLED && !message.content?.includes(`-# ${icon("flask_mini")} labsCore will be shutting down`)){
    if(!message.content) message.content = `-# ${icon("flask_mini")} labsCore will be shutting down ${timestamp(EOS_NOTICE_TIMESTAMP, "R")} • ${link(EOS_NOTICE_URL, "Learn more", "Learn more", false)}`
    // omnitranslate checks for this, so we have to handle it as a special case
    else if(message.content.startsWith(`-# ${icon("subtext_translate")}`)) {
      message.content = message.content.split("\n")[0] + `\n-# ${icon("flask_mini")} labsCore will be shutting down ${timestamp(EOS_NOTICE_TIMESTAMP, "R")} • ${link(EOS_NOTICE_URL, "Learn more", "Learn more", false)}\n` + message.content.split("\n").slice(1,99999).join("\n")
    } else message.content = `-# ${icon("flask_mini")} labsCore will be shutting down ${timestamp(EOS_NOTICE_TIMESTAMP, "R")} • ${link(EOS_NOTICE_URL, "Learn more", "Learn more", false)}` + "\n" + message.content
  }

  let flags = 0;
  
  // Special labsCore context clues for the command.
  // Currently only used to identify incognito requests
  // on user slash commands.
  if(context._meta){
    if(context._meta.isIncognito) flags = MessageFlags.EPHEMERAL
  }
  
  message.flags = flags;

  // Handle responses for interaction context
  if(context.editOrRespond){
    if(context._meta?.replacementMessageId){
      return context.editMessage(context._meta.replacementMessageId, message).catch((e)=>{
      basecamp(formatErrorMessage(3, "SHARD_MESSAGE_ERROR", `\`[Shard ${context.client.shardId}]\` Command \`${context.command.name}\` failed to respond:\nGuild: \`${context.guild?.id}\`\nChannel: \`${context.channel?.id}\`\nUser: \`${context.user?.id}\`\`\`\`js\n${e}\`\`\``), message);
      });
    }
  
    if(context._meta?.incognitoReason){
      // TODO: make this an applyIncognitoNotice helper
      if(message.content){
        if(message.embeds && message.embeds.length <= 4){
          message.embeds.unshift({
            description: `${icon("flask_incognito")} ​  ​  This response has been made incognito due to ${MESSAGE_BLOCK_REASONS[context._meta.incognitoReason].message}.`,
            color: COLORS.incognito
          })
        }
      } else {
        // Uses new subtext formatting to look more "native"
        message.content = `-# ${icon("flask_mini")} This response has been made incognito due to ${MESSAGE_BLOCK_REASONS[context._meta.incognitoReason].message} • ${link("https://support.discord.com/hc/en-us/articles/" + MESSAGE_BLOCK_REASONS[context._meta.incognitoReason].support_article, "Learn More", "Support Article")}${(context._meta.incognitoMetadata ? " • " + link(context._meta.incognitoMetadata, "View Missing Permissions", "View Missing Permissions", false) : "")}`
      }
    }

    return context.editOrRespond(message).catch(async (e)=>{
      try{

        const errorData = await e.response.json();
        if(MESSAGE_BLOCK_REASONS[errorData.code]){
          // Delete the public response
          await context.deleteResponse();
    
          message.flags = MessageFlags.EPHEMERAL
  
          // Create a notice
          if(message.content){
            if(message.embeds && message.embeds.length <= 4){
              message.embeds.unshift({
                description: `${icon("flask_incognito")} ​  ​  This response has been made incognito due to ${MESSAGE_BLOCK_REASONS[errorData.code].message}.`,
                color: COLORS.incognito
              })
            }
          } else {
            // Uses new subtext formatting to look more "native"
            message.content = `-# ${icon("flask_mini")} This response has been made incognito due to ${MESSAGE_BLOCK_REASONS[errorData.code].message} • ${link("https://support.discord.com/hc/en-us/articles/" + MESSAGE_BLOCK_REASONS[errorData.code].support_article, "Learn More", "Support Article")}`
          }
  
          let replacementMessage = await context.createMessage(message);
          
          if(!context._meta) context._meta = {}
          context._meta.replacementMessageId = replacementMessage.id;
    
          return replacementMessage;
        }
      }catch(e){
        console.log(e)
      }
      basecamp(formatErrorMessage(3, "SHARD_MESSAGE_ERROR", `\`[Shard ${context.client.shardId}]\` Command \`${context.command?.name || context.message?.content || "Unknown Command (check console)"}\` failed to respond: @ \`${Date.now()}\`\nGuild: \`${context.guild?.id}\`\nChannel: \`${context.channel?.id}\`\nUser: \`${context.user?.id}\`\`\`\`js\n${e}\`\`\``), message);
      if(!context.command?.name && !context.message?.content) console.log(context)
    })
  }

  // Only respond if the command is still available and we have permissions to respond.
  if(!context.message.deleted && context.channel.can(Permissions.SEND_MESSAGES)) return context.editOrReply(message).catch((e)=>{   
    console.log(e.status)
    basecamp(formatErrorMessage(3, "SHARD_MESSAGE_ERROR", `\`[Shard ${context.client.shardId}]\` Command \`${context.message?.content}\` failed to respond:\nGuild: \`${context.guild?.id}\`\nChannel: \`${context.channel?.id}\`\nUser: \`${context.user?.id}\`\`\`\`js\n${e}\`\`\``), message);
  })
}