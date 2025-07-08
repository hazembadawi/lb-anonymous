fx_version 'cerulean'
game 'gta5'

author 'HBAD'
description 'Anonymous lb-phone app'
version '1.0.0'

ui_page 'ui/index.html'

files {
    'ui/*',
    'ui/components/*',
    'ui/assets/*'
}

client_scripts {
    'client.lua'
}

server_scripts {
    'server.lua'
}

dependency 'lb-phone'
