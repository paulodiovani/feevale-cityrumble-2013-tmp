
/* JavaScript content from wlclient/js/challengeHandlers/deviceAuthAutoProvisioningChallengeHandler.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
var wl_authAutoDeviceProvisioningChallengeHandler = WL.Client
        .createProvisioningChallengeHandler("wl_deviceAutoProvisioningRealm");

wl_authAutoDeviceProvisioningChallengeHandler.createCustomCsr = function(challenge){
	wl_authAutoDeviceProvisioningChallengeHandler.submitCustomCsr({}, challenge);
};