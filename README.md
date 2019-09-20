# chat-wheel
Improves TERA's quick chat functionalities 

## Features
* Send quick chat in raid chat instead of always party
* Send quick chat in party/raid notice (configurable)
* Replace phrases based on character and/or dungeon (zone)

## Commands
`chat-wheel notice [on/off]`: Enable/Disable sending wheel as notice (useful for mech calling)

`chat-wheel`: Returns currently configured phrases

`chat-wheel record cmd left|top|right|bottom` : Records next sent message as the command to trigger each phrase

`chat-wheel record global|me|dungeon|current left|top|right|bottom` : Records next sent message as the chat wheel message for :
  * global : Global chat wheel
  * me : Currently logged character global
  * dungeon : Global dungeon wheel
  * current : Currently logged character dungeon wheel
  
## Phrase priority
1. character and zone 
2. zone
3. character 
4. global.
