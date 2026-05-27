# SunYieldML
ML model predicts the solar power that can be generated according to the sunlight and the air temperature. The UI is there to feed that data to the model and Express JS to handle backend logic

A) Problem:
People blindly invest on solar panels, without calculating how much will they profitable according to his solar panel installment location and wasting money or not taking desired advantage, or sometimes over generating power!

B) Identified Solution:
Developing a platform to calculate how much electricity could be generated using the solar power, by specifying the specific location of installment. 
In that way, people could find out how much value they can make up from the investment he is going to do

C) How did i implement the solution
Step 01: 
I searched for a good dataset and found a Kaggle dataset on a Solar Power House consisting with several generators. And identified the best suiting algorithm is Linear Regression since this is a number prediction.

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

Step 05:
From there I identified that:
  Irradiation is having a linear relationship with the Power
  Air temperature(Ambient) doesn't show a mathmatical relationship directly
  Panel temperature(Module) shows a relationship closer to a linear relationship with the Power

Step 06:
Since Irradiation showed a linear relationship, I took it as x1.
I decided to remove the module temperature from the model eventhough it shows a relationship, if we cannot measure as a user when we ask our model to do a prediction, it is going to be a fail
Identified eventhough there is no direct relationship is shown with the air temperature, there should be a relationship since it affects the panel temperature and its performance in a hardware level as well

Step 07:
Upon further thinking, and after graphing, I realized that even the "Air temperature" is a factor, it won't be a factor on its own. Because if there are no sunlight, there will be no power generated if the air temperature is high

<img width="672" height="461" alt="image" src="https://github.com/user-attachments/assets/5f86ccc1-038c-47eb-af26-edf472bf455d" />

Step 08:
Then I needed to further dive deep to find what's going on with the Air temperature, when there is sunlight. So I plotted 3d graph with air temperature, sunlight and power

<img width="964" height="418" alt="image" src="https://github.com/user-attachments/assets/d4699cb4-b0de-4109-8bfe-84e4e8ad04c1" />

Step 09:
Since there is a hardware constraint that is said the panel temperature affects the performance of power generation from a solar panel, and sunlight + air temperature contributes to that, and also because of air temperature on its own do nothing to the power generation, but when combined with sunlight there is a tend;
I did feature engineering, engineering a new feature by multiplying sunlight with air temperature

Step 10:
Following my tutor "Andrew NG", since there are only 2 vectors in the model, I graphed those 2 features in the model 
(x1 = sunlight and x2 = engineered feature)

<img width="648" height="453" alt="image" src="https://github.com/user-attachments/assets/05a3fb3f-3d90-4139-9b9a-263482b2302a" />

Step 10:
So I could decide that new feature is also scaler since our model looks likes fits in a straight line
fx = w1x1 . w2x2 + b

Step 11:
I converted the target variable to be a percentage, so our model can predict the percentage and then multiply it from the max value, which will be easier to visualize

<img width="695" height="258" alt="image" src="https://github.com/user-attachments/assets/0335919e-d561-4de2-a5f5-20b0dc3d570a" />

Step 12:
Then before the final few steps, I took few time to feature scaling, so our model won't accidentally diverge or take much time to converge

<img width="710" height="494" alt="image" src="https://github.com/user-attachments/assets/bb6220ec-9b00-4fd5-8962-d8937f1c146d" />

<img width="635" height="445" alt="image" src="https://github.com/user-attachments/assets/f79e0643-c57a-4540-a7fc-a4b4eefa3723" />

Step 13:
Finally I imported skicit learn libraries to implement the linear regression!
which gave me values for w1,w2,b

<img width="673" height="387" alt="image" src="https://github.com/user-attachments/assets/82d55423-00dc-4363-9165-24755cd94d33" />

Step 14:
Before wrapping up and end the MLOPS loop, I checked the performance of the model, which were outstanding!

<img width="693" height="514" alt="image" src="https://github.com/user-attachments/assets/f199f6ed-fa5a-4ab5-b273-51a082565640" />

<img width="707" height="489" alt="image" src="https://github.com/user-attachments/assets/232eba9a-3315-468c-bb76-1b56bbe2f638" />

