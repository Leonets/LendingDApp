import fs from 'fs';
import dotenv from 'dotenv';

// Load the variables from the .env file
dotenv.config();

// Read the template file for entities
fs.readFile('scrypto/dapp_definition/dynamic_claimed_entities.rtm', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading template file:', err);
    return;
  }

  // Replace placeholders with actual values
  const replacedData = data.replace(/\$([^\s]+)\$/g, (match, key) => {
    return process.env[key] || match;
  });

  // Write the updated content to a new file
  fs.writeFile('scrypto/dapp_definition/claimed_entities_v1.rtm', replacedData, 'utf8', err => {
    if (err) {
      console.error('Error writing updated file:', err);
      return;
    }
    console.log('File entities_v1 updated successfully!');
  });
});

// Read the template file for website
fs.readFile('scrypto/dapp_definition/dynamic_claimed_website.rtm', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading template file:', err);
    return;
  }

  // Replace placeholders with actual values
  const replacedData = data.replace(/\$([^\s]+)\$/g, (match, key) => {
    return process.env[key] || match;
  });

  // Write the updated content to a new file
  fs.writeFile('scrypto/dapp_definition/claimed_website_v1.rtm', replacedData, 'utf8', err => {
    if (err) {
      console.error('Error writing updated file:', err);
      return;
    }
    console.log('File website_v1 updated successfully!');
  });
});