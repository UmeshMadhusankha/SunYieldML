# SunYieldML
ML model predicts the solar power that can be generated according to the sunlight and the air temperature. The UI is there to feed that data to the model and Express JS to handle backend logic

A) Problem:
People blindly invest on solar panels, without calculating how much will they profitable according to his solar panel installment location and wasting money or not taking desired advantage, or sometimes over generating power!

B) Identified Solution:
Developing a platform to calculate how much electricity could be generated using the solar power, by specifying the specific location of installment. 
In that way, people could find out how much value they can make up from the investment he is going to do

C) How did i implement the solution
Step 01: 
I searched for a good dataset and found a Kaggle dataset on a Solar Power House consisting with several generators.

Step 02:
I observed the dataset by printing out few lines. There were fields like AC_POWER, DC_POWER, AMBIENT_TEMPERATURE, MODULE_TEMPERATURE, IRRADIATION

Step 03:
I eliminated few fields like DC_POWER. since I did not focus on calculating the power coversion rate losses as it is almost similar for all solar panels

<img width="652" height="416" alt="image" src="https://github.com/user-attachments/assets/7e2e42c2-a629-41d0-9317-800f00b05059" />

Step 04:
I plotted each vectors - AMBIENT_TEMPERATURE, MODULE_TEMPERATURE, IRRADIATION against the AC_POWER individually

<img width="704" height="459" alt="image" src="https://github.com/user-attachments/assets/18664403-bbd3-4043-86b1-35cd395fcc32" />
<img width="747" height="463" alt="image" src="https://github.com/user-attachments/assets/099cf446-d890-4889-9aed-086568cfc5bb" />
<img width="755" height="461" alt="image" src="https://github.com/user-attachments/assets/b821da01-e86d-48e0-ba69-5509634a177d" />




