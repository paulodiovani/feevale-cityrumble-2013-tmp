/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2010, 2011. All Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights:  
 * Use, duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp. 
 *******************************************************************************/
// NLS_CHARSET=UTF-8
define({
		'sim_common_start' : 'Uruchamianie',
		'sim_common_stop' : 'Zatrzymaj',
		'sim_common_error_button' : 'Generuj błąd',

		'sim_accelerometer_accelX_label' : 'X:',
		'sim_accelerometer_accelY_label' : 'Y:',
		'sim_accelerometer_accelZ_label' : 'Z:',
		'sim_accelerometer_nextAccel_button' : 'Dalej',
		'sim_accelerometer_startStop_button' : 'Uruchom/Zatrzymaj',

		'sim_battery_plugedIn_label' : 'Podłączono:',
		'sim_battery_batteryLevel_label' : 'Poziom naładowania akumulatora:',

		'sim_battery_hrule_labels' : '0%,20%,40%,60%,80%,100%',

		'sim_camera_choose_image_camera' : 'Wybierz obraz, który zostanie użyty na potrzeby aparatu:',
		'sim_camera_currently_selected_camera' : 'Aktualnie wybrany obraz na potrzeby aparatu:',
		'sim_camera_choose_image_album_library' : 'Wybierz obraz, który zostanie użyty na potrzeby albumu/biblioteki:',
		'sim_camera_currently_selected_album_library' : 'Aktualnie wybrany obraz na potrzeby albumu/biblioteki:',
		'sim_camera_cannotLoadApplet' : "Symulacja interfejsu API aparatu jest wyłączona (aplet nie został załadowany, sprawdź ustawienia Java)",

		'sim_camera_xs' : 'XS',
		'sim_camera_s' : 'S',
		'sim_camera_m' : 'M',
		'sim_camera_l' : 'L',
		'sim_camera_xl' : 'XL',

		'sim_capture_choose_audio' : 'Wybierz pliki audio',
		'sim_capture_audio1' : 'Audio 1',
		'sim_capture_audio2' : 'Audio 2',
		'sim_capture_audio3' : 'Audio 3',
		'sim_capture_playAudio' : 'Odtwórz',
		'sim_capture_choose_video' : 'Wybierz pliki wideo',
		'sim_capture_video1' : 'Wideo 1',
		'sim_capture_video2' : 'Wideo 2',
		'sim_capture_video3' : 'Wideo 3',
		'sim_capture_playVideo' : 'Odtwórz',
		'sim_capture_browserSupport' : 'Interfejs użytkownika symulujący przechwytywanie jest dostępny w przeglądarkach Google Chrome i Mozilla Firefox.',
		'sim_capture_cannotLoadApplet' : "Symulacja interfejsu API przechwytywania jest wyłączona (aplet nie został załadowany, sprawdź ustawienia Java)",
		'sim_compass_error_random' : 'Generuj losowy błąd',
		'sim_compass_generate' : 'Generuj',

		'sim_compass_heading_label' : 'Nagłówek:',
		'sim_compass_next_button' : 'Dalej',
		'sim_compass_startStop_button' : 'Uruchom/Zatrzymaj',
		'sim_compass_error_button' : 'Generuj błąd',

		'sim_contacts_refresh_label' : 'Odśwież',
		'sim_contacts_nowebsql' : 'Symulacja interfejsu API kontaktów Cordova została wyłączona, ponieważ bazy danych WebSQL nie są obsługiwane w tej przeglądarce.',

		'sim_device_select_label' : 'Wybierz urządzenie:',
		'sim_device_prev_button' : 'Wstecz',
		'sim_device_next_button' : 'Dalej',
		'sim_device_no_version_info' : 'Brak informacji o wersji',

		'sim_events_pause_button' : 'Pause',
		'sim_events_resume_button' : 'Wznów',
		'sim_events_back_button' : 'Wstecz',
		'sim_events_menu_button' : 'Menu',
		'sim_events_search_button' : 'Szukaj',
		'sim_events_online_button' : 'Tryb z połączeniem',
		'sim_events_offline_button' : 'Tryb bez połączenia',
		'sim_events_startCall_button' : 'Rozpocznij połączenie',
		'sim_events_endCall_button' : 'Zakończ połączenie',
		'sim_events_volumeUp_button' : 'Głośniej',
		'sim_events_volumeDown_button' : 'Ciszej',

		'sim_file_refresh_button' : "Odśwież",
		'sim_file_cannotLoadApplet' : "Symulacja interfejsu API pliku jest wyłączona (aplet nie został załadowany, sprawdź ustawienia Java)",
		'sim_geoloc_longitude_label' : 'Długość geograficzna',
		'sim_geoloc_latitude_label' : 'Szerokość geograficzna',
		'sim_geoloc_accuracy_label' : 'Dokładność',
		'sim_geoloc_altitude_label' : 'Wysokość',
		'sim_geoloc_altitudeAccuracy_label' : 'Dokładność pomiaru wysokości',
		'sim_geoloc_heading_label' : 'Nagłówek',
		'sim_geoloc_velocity_label' : 'Szybkość',
		'sim_geoloc_next_button' : "Dalej",
		'sim_geoloc_startStop_button' : "Uruchom/Zatrzymaj",
		'sim_geoloc_usingFFgeolocation' : "Korzystanie z usługi geolokalizacji udostępnianej w przeglądarce Firefox.",

		'sim_media_url_label' : 'Adres URL:',
		'sim_media_playBack_label' : 'Odtwarzanie',
		'sim_media_length_label' : 'Długość',
		'sim_media_audioRecording_label' : 'Zapis audio',
		'sim_media_audioRecording_status' : 'Bezczynne',
		'sim_media_audioRecording_idle' : 'Bezczynne',
		'sim_media_audioRecording_recording' : 'Zapis',

		'sim_network_none' : 'Brak',
		'sim_network_ethernet' : 'Sieć Ethernet',
		'sim_network_wifi' : 'Sieć WiFi',
		'sim_network_2g' : 'Sieć 2G',
		'sim_network_3g' : 'Sieć 3G',
		'sim_network_4g' : 'Sieć 4G',
		'sim_network_cell' : 'Ogólne połączenie sieci komórkowej',
		'sim_network_unknown' : 'Nieznana sieć'

});

