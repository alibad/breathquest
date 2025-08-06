# SpiroSmart: Using a Microphone to Measure Lung Function on a Mobile Phone

**Authors:** Eric C. Larson¹†, Mayank Goel²†, Gaetano Boriello², Sonya Heltshe³, Margaret Rosenfeld³, Shwetak N. Patel¹,²

¹ Electrical Engineering, ² Computer Science & Engineering, DUB Institute, University of Washington, Seattle, WA 98195  
³ Seattle Children's Hospital, Center for Clinical and Translational Research, 4800 Sand Point Way NE, Seattle, WA 98105

*UbiComp '12, Sep 5 – Sep 8, 2012, Pittsburgh, USA*

---

## Abstract

Home spirometry is gaining acceptance in the medical community because of its ability to detect pulmonary exacerbations and improve outcomes of chronic lung ailments. However, cost and usability are significant barriers to its widespread adoption. To this end, we present SpiroSmart, a low-cost mobile phone application that performs spirometry sensing using the built-in microphone. We evaluate SpiroSmart on 52 subjects, showing that the mean error when compared to a clinical spirometer is 5.1% for common measures of lung function. Finally, we show that pulmonologists can use SpiroSmart to diagnose varying degrees of obstructive lung ailments.

**Keywords:** Health sensing, spirometry, mobile phones, signal processing, machine learning

---

## Introduction

Spirometry is the most widely employed objective measure of lung function and is central to the diagnosis and management of chronic lung diseases, such as asthma, chronic obstructive pulmonary disease (COPD), and cystic fibrosis. During a spirometry test, a patient forcefully exhales through a flow-monitoring device (a tube or mouthpiece), which measures instantaneous flow and cumulative exhaled volume.

Spirometry is generally performed in medical offices and clinics using conventional spirometers, but home spirometry with portable devices is slowly gaining acceptance. Measurement of spirometry at home allows patients and physicians to more regularly monitor for trends and detect changes in lung function that may need evaluation and/or treatment.

### Benefits of Home Spirometry

Home spirometry has the potential to result in:
- Earlier treatment of exacerbations
- More rapid recovery
- Reduced health care costs
- Improved outcomes

### Current Challenges

However, challenges currently faced by home spirometry include:
- **Cost** - High-end clinical spirometers can cost upwards of $5000 USD
- **Patient compliance and usability**
- **Integrated method for uploading results to physicians**
- **Lack of coaching and quality control mechanisms**

### SpiroSmart Solution

SpiroSmart is a smartphone-based approach that measures lung function using the phone's built-in microphone (i.e., a complete software-enabled solution). The system works by:

1. User holds smartphone at approximately arm's length
2. Breathes in full lung volume
3. Forcefully exhales at the screen of the phone until entire lung volume is expelled
4. Phone's microphone records the exhalation
5. Audio data sent to server for analysis
6. Server calculates exhaled flow rate using models of vocal tract and sound reverberation

---

## Explanation of Spirometry

A standard spirometer measures flow rate of air as it passes through a mouthpiece. This flow can be integrated to achieve Flow vs. Time (FT), Volume vs. Time (VT), or Flow vs. Volume (FV) plots of the expiration.

### Key Measurements

From spirometry plots, several quantities are measured:

1. **Forced Vital Capacity (FVC)** - Total expelled volume during expiration
2. **Forced Expiratory Volume in one second (FEV1)** - Volume exhaled in first second
3. **FEV1/FVC** - Ratio of the aforementioned two measures
4. **Peak Expiratory Flow (PEF)** - Maximum flow velocity reached during test

### Clinical Interpretation

The most common clinically-reported measures are FEV1, FVC, and FEV1/FVC, used to quantify the degree of airflow limitation in chronic lung diseases. 

**Normal vs. Abnormal Values:**
- Healthy result: >80% of predicted value based on height, age, and gender
- **Mild Lung Dysfunction:** 60-79%
- **Moderate Lung Dysfunction:** 40-59%
- **Severe Lung Dysfunction:** below 40%

### Curve Shape Analysis

Diagnosis involves subjective evaluation of the flow curve shape by pulmonologists:
- **Linear slope** - indicates absence of airflow limitation (normal lung function)
- **Concave or "scooped" slope** - signifies airflow limitation (e.g., asthma or COPD)
- **Bowing curve with plateau** - suggestive of restrictive lung disease

---

## Modern Spirometry Devices

### Types of Flow-based Spirometers

1. **Pneumotachographs** - Measure pressure differential across membrane
2. **Turbines** - Measure rotational flow
3. **Anemometers** - Hot-wire flow measurement
4. **Ultrasounds** - Ultrasonic flow detection

### Cost Comparison

- **High-end clinical spirometers:** $5000+ USD (size of small refrigerator)
- **Portable ATS-endorsed spirometers:** $1,000-$4,000 USD (laptop-sized)
- **Digital home spirometers:** $50-$200 USD (limited functionality)
- **Peak flow meters:** $10-$50 USD (only measure PEF)
- **SpiroSmart:** Cost of smartphone app (leverages existing device)

---

## Related Work

### Mobile Phone Based Health Sensing

Previous research has explored smartphone-based health sensing:
- External sensors connected to smartphones (PPG, microscopy)
- Camera-based solutions (pulse detection, eye examinations)
- No-hardware-modification approaches

### Audio Based Health Sensing

Several technologies sense medically relevant quantities using microphones:
- In-ear microphones for eating detection
- Wheeze detection with throat microphones
- Respiratory rate sensing
- Heart rate extraction using mobile phones
- Cough detection and counting

---

## Data Collection Procedure

### Study Participants

**Total participants:** 52 volunteers (45-minute study sessions)

**Demographics:**
- Males: 32 (61.5%)
- Age: 32 years (range: 18-63)
- Height: 172 cm (range: 152-196)
- Reported lung ailments: 25% (mild asthma, chronic bronchitis, etc.)
- Never performed spirometry: 29 (55.8%)

### Equipment and Setup

- **Smartphone:** iPhone 4S with custom data collection app
- **Clinical spirometer:** nSpire KoKo Legend (ATS certified, pneumotach type)
- **Recording:** Built-in microphone at 32 kHz
- **Calibration:** 3L syringe before each session

### Test Configurations

Participants used SpiroSmart in four random configurations:
1. With mouthpiece only
2. With distance sling only
3. With both attachments
4. With neither attachment

### Data Collection Results

- **Clinical spirometer uses:** 248
- **SpiroSmart uses:** 864
- **Longitudinal data:** 10 participants returned for 2 additional sessions

---

## Algorithm and Theory of Operation

### Main Goals

1. Compensate for pressure losses as sound travels from mouth to microphone
2. Convert pressure values to approximation of flow
3. Remove effects of AC-coupling

### Processing Pipeline

#### Distance and Flow Compensation

**Inverse radiation modeling** compensates for:
- Pressure losses over distance from mouth to microphone
- Reverberation/reflections around subject's body

Transfer function approximated by spherical baffle in infinite plane:
```
H(ejω) = P(ejω) / Pmics(ejω) ~ jωChead/cDarm * exp(-jωDarm/c)
```

Where:
- Darm = arm length
- Chead = head circumference (approximated from height)
- c = speed of sound

#### Flow Rate Conversion

For turbulent airflow, pressure drop across lips to flow rate:
```
ulips(t) ~ 2ρ^(-1) * sqrt(2ρ * plips(t))
```

### Feature Extraction

Three transformations used to approximate volumetric flow rate:

#### 1. Envelope Detection
- Hilbert envelope extraction
- Low-pass filtering
- Assumption: envelope approximates flow rate (signal power at low frequency)

#### 2. Spectrogram Processing
- 30ms frames with 50% overlap
- Hamming windowing
- Resonance tracking using local maxima
- Resonances >300ms preserved, others discarded as noise

#### 3. Linear Predictive Coding (LPC)
- Multiple LPC models with filter orders: 2, 4, 8, 16, 32
- Source power estimation as flow rate approximation
- Vocal tract filter modeling

#### Post-Processing
- Denoising using Savitsky-Golay polynomial filter (order 3, size 11)
- Both filtered and non-filtered signals fed to regression

---

## Machine Learning Regression

### Two-Stage Regression Approach

#### Stage 1: Lung Function Regression
- **Target measures:** PEF, FEV1, FVC
- **Method:** Bagged decision trees (100 trees per forest)
- **PEF calculation:** Maximum of each flow feature
- **FVC calculation:** Integration of each flow feature  
- **FEV1 calculation:** Integration during first second
- **Ensemble decision:** K-means clustering (k=2) of predictions

#### Stage 2: Curve Shape Regression
- **Target:** Flow rate and volume for each 15ms frame
- **Method:** Conditional Random Field (CRF) + bagged decision trees
- **Normalization:** Generate normalized flow-volume curves for shape
- **Final curve:** Scale normalized shape by lung function measures

### Model Folding and Personalization

**General Models:**
- Multiple training subsets with diverse folding strategies
- Participants never in both training and testing folds
- Ensemble of models clustered for final decision

**Personalized Models:**
- Augmented folds containing repeat session data
- Mixed with general model data
- Evaluated separately from general models

---

## Results and Discussion

### Estimate of Lung Function Measures

#### Distribution of Percent Error

**Mean percent errors (all subjects):**
- FVC: 5.2%
- FEV1: 4.8% 
- PEF: 6.3%
- FEV1/FVC: 4.0%

**With personalization (abnormal subjects):**
- FVC: 5.0%
- FEV1: 3.5% (significant improvement)
- PEF: 4.6% (significant improvement) 
- FEV1/FVC: 3.6% (significant improvement)

#### Accuracy Within Clinical Limits

**Normal subjects:**
- FVC: ~80% within expected variability
- FEV1: >90% within expected variability
- PEF: >90% within expected variability

**Abnormal subjects:**
- Significant drop in accuracy
- Personalization improves performance
- FEV1/FVC: 80-90% accuracy, near 100% with personalization

### Configuration Analysis

#### Effect of Mouthpiece and Distance Control

- **FEV1:** Small but significant improvement (~0.5%) with both mouthpiece and sling
- **PEF:** Significant improvement (~1%) when no mouthpiece used
- **FVC:** No statistically significant differences
- **General conclusion:** Additional equipment not necessary for most applications

#### Participant Preferences

- **54%** preferred "mouthpiece only" configuration
- Comfort vs. mobility trade-offs noted
- Some felt "awkward without mouthpiece"
- Others preferred simplicity of phone-only approach

### Clinical Validation Study

#### Pulmonologist Survey Setup

- **5 pulmonologists** evaluated curves
- **10 subjects** total (5 normal, 5 abnormal including 2 outliers)
- **Blinded comparison** between SpiroSmart and clinical spirometer curves
- **Standard spirometry summary sheets** used

#### Survey Results

**Normal curves (5 subjects):**
- **23 of 25 responses** matched identically between SpiroSmart and clinical spirometer
- **2 responses** were false positives (rated as mild obstruction)

**Abnormal curves (3 subjects):**
- **9 of 15 responses** matched exactly
- **2 responses** within one degree
- **Strong agreement** on both normal and abnormal diagnoses

**Outlier cases (2 subjects):**
- Significant disagreement due to inflated lung function values
- Still correctly identified as abnormal in most cases

---

## Limitations and Future Work

### Current Limitations

#### 1. Inhalation Measures
- Cannot measure inhalation (inaudible)
- Limits comprehensive spirometry assessment

#### 2. Environmental Requirements
- Relatively quiet setting required
- Precludes verbal coaching during test
- May limit pediatric applications

#### 3. FVC Accuracy
- Decreased accuracy compared to other measures
- Only first 3 seconds audible (test can last 6+ seconds)
- Regression may be extrapolating rather than measuring

#### 4. Computational Requirements
- Real-time calculation not possible on current smartphones
- Cloud processing currently required
- Flow-volume loop calculation computationally intensive

#### 5. Outlier Detection
- Small percentage of users (2/52) produce erroneous values
- Need better methods to identify and handle outliers

### Future Directions

#### 1. User Interface Improvements
- Embedded coaching and motivation systems
- Game-like interfaces for children
- Improved compliance mechanisms

#### 2. Signal Enhancement
- Dynamic phone positioning during test
- Improved signal-to-noise ratio for end of test
- Better handling of low-volume exhalation

#### 3. Clinical Studies
- Larger longitudinal studies
- Trend tracking validation
- Real-world deployment testing

#### 4. Technical Optimization
- On-device processing capabilities
- Reduced cloud dependency
- Improved real-time feedback

---

## Conclusion

SpiroSmart represents a significant advancement in accessible spirometry technology. Key findings include:

### Performance Summary
- **Mean error:** 5.1% compared to clinical spirometers
- **Comparable accuracy** to handheld spirometers
- **Effective diagnosis** of obstructive lung conditions
- **No user-specific calibration** required (though personalization improves results)

### Clinical Validation
- **Pulmonologist agreement** with clinical spirometer diagnoses
- **Effective screening** for both normal and abnormal lung function
- **Degree of obstruction** accurately classified

### Practical Benefits
- **Low cost** - leverages existing smartphone hardware
- **High portability** - no additional equipment required
- **Easy data upload** - built-in connectivity
- **Integrated coaching** - potential for improved compliance

### Target Applications
SpiroSmart is most suitable for:
- Home monitoring of chronic lung conditions
- Patients already familiar with spirometry
- Resource-limited environments
- Screening and trend detection (not replacement for clinical spirometry)

### Impact Potential
By reducing cost and improving accessibility, SpiroSmart can help narrow the digital divide in healthcare access, particularly benefiting:
- Developing world applications
- Home-based chronic disease management
- Early detection and monitoring programs
- Integration with comprehensive health management systems

**SpiroSmart demonstrates that smartphone-based spirometry can provide clinically relevant lung function measurements, opening new possibilities for accessible respiratory health monitoring.**

---

## References

*[Original paper contains 40 numbered references - abbreviated here for space]*

Key references include standards from American Thoracic Society (ATS), signal processing techniques, mobile health sensing research, and clinical spirometry validation studies.

---

*† The first two authors are equal contributors to this work.*

**Copyright 2012 ACM 978-1-4503-1224-0/12/09**