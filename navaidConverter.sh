#!/bin/bash

# This converts the Nav Aid file downloaded from: http://ourairports.com/data/
# into a JSON file sutible for inclusion in a webpage.
OUTFILE="navaids.js"
FIRST=1
echo -e "navaids = [\r\n" > $OUTFILE
#readarray lines < "navaids.csv"
#for line in ${lines[@]}
while IFS='' read -r line;
do
	#echo "$line"
	if [ $FIRST -eq 0 ] ; then
		IFS=',' read -r -a partsArray <<< "$line"
		if [ "${partsArray[4]}" = "\"VOR-DME\"" -o "${partsArray[4]}" = "\"VORTAC\"" ]; then
			echo -e "\t{\r\n" >> $OUTFILE
			echo -e "\t\t\"callsign\": ${partsArray[2]},\r\n" >> $OUTFILE
			echo -e "\t\t\"name\": ${partsArray[3]},\r\n" >> $OUTFILE
			echo -e "\t\t\"type\": ${partsArray[4]},\r\n" >> $OUTFILE
			echo -e "\t\t\"latitude_deg\": ${partsArray[6]},\r\n" >> $OUTFILE
			echo -e "\t\t\"longitude_deg\": ${partsArray[7]},\r\n" >> $OUTFILE

			MAGVAR=${partsArray[15]} 
			if [ -z $MAGVAR ]; then
				MAGVAR=0;
			fi
			echo -e "\t\t\"magnetic_variation_deg\": $MAGVAR,\r\n" >> $OUTFILE
		
			echo -e "\t},\r\n" >> $OUTFILE
		fi
	fi
	FIRST=0
done < "navaids.csv"
echo "]" >> $OUTFILE