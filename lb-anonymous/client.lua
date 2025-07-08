local identifier = "lb-anonymous"

while GetResourceState("lb-phone") ~= "started" do
    Wait(500)
end

local function addApp()
    local added, errorMessage = exports["lb-phone"]:AddCustomApp({
        identifier = identifier, 
        name = "Anonymous",
        description = "IF YOU KNOW YOU KNOW",
        developer = "HBAD",
        defaultApp = true, 
        size = 404, 
        ui = GetCurrentResourceName() .. "/ui/index.html",
        icon = "https://cfx-nui-" .. GetCurrentResourceName() .. "/ui/assets/icon.svg",
        fixBlur = true 
    })
    if not added then
        print("Could not add app:", errorMessage)
    else
        print("lb-anonymous app added successfully")
    end
end

addApp()

AddEventHandler("onResourceStart", function(resource)
    if resource == "lb-phone" then
        addApp()
    end
end)

local directions = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" }
local oldYaw, oldDirection

RegisterNUICallback("getDirection", function(data, cb)
    cb(oldDirection)
end)

RegisterNUICallback("drawNotification", function(data, cb)
    BeginTextCommandThefeedPost("STRING")
    AddTextComponentSubstringPlayerName(data.message)
    EndTextCommandThefeedPostTicker(false, false)
    cb("ok")
end)

RegisterNUICallback("sendGlobalNotification", function(data, cb)
    print("[lb-anonymous] sendGlobalNotification called with:", json.encode(data))
    TriggerServerEvent("anonymous:sendNotificationToAll", data)
    cb("ok")
end)

RegisterNetEvent("lb-anonymous:receiveNotification")
AddEventHandler("lb-anonymous:receiveNotification", function(title)
    SendNUIMessage({
        type = "sendGlobalNotification",
        title = title
    })
end)

Citizen.CreateThread(function()
    while true do
        Wait(25)
        local yaw = math.floor(360.0 - ((GetFinalRenderedCamRot(0).z + 360.0) % 360.0) + 0.5)
        if yaw == 360 then yaw = 0 end
        if oldYaw ~= yaw then
            oldYaw = yaw
            oldDirection = yaw .. "° " .. directions[math.floor((yaw + 22.5) / 45.0) % 8 + 1]
            exports["lb-phone"]:SendCustomAppMessage(identifier, {
                type = "updateDirection",
                direction = oldDirection
            })
        end
    end
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        local playerId = GetPlayerServerId(PlayerId())
        SendNUIMessage({
            action = 'setPlayerId',
            playerId = playerId
        })
        break
    end
end)

RegisterNUICallback("getPlayerId", function(_, cb)
    local playerId = GetPlayerServerId(PlayerId())
    cb(playerId)
end)

RegisterNUICallback("sendChatMessage", function(data, cb)
    print('client NUI sendChatMessage:', json.encode(data))
    TriggerServerEvent("lb-anonymous:server:sendChatMessage", data)
    cb("ok")
end)

RegisterNetEvent("lb-anonymous:broadcastMessage")
AddEventHandler("lb-anonymous:broadcastMessage", function(data)
    print('Client received broadcast:', json.encode(data))
    exports["lb-phone"]:SendCustomAppMessage(identifier, {   
    type      = "broadcastAnonymousChat",
    playerId  = data.playerId,
    color     = data.color,
    message   = data.message
})
end)
RegisterNetEvent('anonymous:openApp', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'anonymous:open' })
end)

RegisterNetEvent('anonymous:closeApp', function()
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'anonymous:close' })
end)
RegisterNetEvent("anonymous:client:showNotif", function(payload)
    print("[anonymous] client event arrived: "..json.encode(payload))
    if exports["lb-phone"] and exports["lb-phone"].SendNotification then
        print("[anonymous] SendNotification export exists – calling it")
        exports["lb-phone"]:SendNotification(payload)
    else
        print("[anonymous] SendNotification export NOT found on client")
    end
end)
RegisterNUICallback("requestPlayerCoords", function(_, cb)
    local p   = PlayerPedId()
    local v   = GetEntityCoords(p)
    cb({ x = v.x, y = v.y })      
end)
RegisterNUICallback("setWaypoint", function(data, cb)
    SetNewWaypoint(data.x + 0.0, data.y + 0.0)
    cb("ok")
end)