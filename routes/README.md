This directory contains facilities for preprocessing route names so that we can show them in a nice way in the widget. The workflow is as follows:

1. Get the list of all possible headsigns from Ryan and save it as `routes_raw.txt`.

2. Run this through `process_raw` and save this as `formats.txt`.

3. `formats.txt` is a list of route names, one per line, completely uppercase. For each line in the file, append a comma, followed by the nicely-formatted name. The formats are contained within `generate_javascript`. For example, one line might start as

        ORANGEHOPPER

  and you would change it to

        ORANGEHOPPER,OrangeH*OPPER*

4. Run `./generate_javascript formats.txt > routes_out.js` and drag `routes_out.js` into the Dashcode project.

Optionally, you can generate a fake `GetDeparturesByStop` response that will contain every listed headsign. To do this, run `./generate_fake_data routes_raw.txt`. This will produce a Javascript dictionary that should be passed to the widget's `json_success_callback()` function. (Look in the `update_data()` function for details.)
