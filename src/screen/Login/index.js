/* eslint-disable prettier/prettier */
import {
    Text,
    TouchableOpacity,
    View,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import React, { useState, useContext } from 'react';
import AppTextInput from '../../core/component/AppTextInput';
import style from './style';
import { ActivityIndicator } from 'react-native-paper';
import { Snackbar } from 'react-native-paper';
import FeatherIcon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post } from '../../core/helper/services';
import { AppContext } from '../../core/helper/AppContext';

const Login = ({ navigation }) => {
    const [phone, setPhone] = useState(null);
    const [valid, setValid] = useState(null);
    const [count, setCount] = useState(120);
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const { globalData, setGlobalData } = useContext(AppContext);

    const onToggleSnackBar = () => setVisible(!visible);
    const onDismissSnackBar = () => setVisible(false);

    const handleResendOTP = () => {
        if (!intervalId) {
            const id = setInterval(() => {
                setCount(count => {
                    count = count - 1;
                    if (count == 0) {
                        clearInterval(id);
                        setIntervalId(null);
                    }
                    if (count < 0) {
                        return 120;
                    }
                    return count;
                });
            }, 1000);
        }
    };
    const [code, setCode] = useState('');

    const checkAuthentication = async () => {
        setLoading(true);
        let payload = { phone: phone };
        try {
            const data = await post(payload, 'userLogin');
            if (data) {
                if (data.isRegistered) {
                    setLoading(false);
                    setAuthenticated(data.id);
                    setUserLocally(data.id);
                    setGlobalData('userId', id);
                } else {
                    navigation.replace('Register', { phone: phone });
                }
            }
        } catch (error) {
            setLoading(false);
            console.log('error login ===>', error);
        }
    };

    const setUserLocally = async id => {
        const queryParameter = '?userId=' + id.toString();
        try {
            const data = await get('getUser', queryParameter);
            if (data) {
                try {
                    console.log('Fetched Data ==>', data);
                    await AsyncStorage.setItem('userData', JSON.stringify(data));
                    setGlobalData('userData', data);
                    navigation.replace('Home');
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Creating OTP

    const [otp, setOtp] = useState(845398);

    function generateOTP(phoneNumber) {
        // Generate a random 6-digit number
        // const randomOtp = Math.floor(100000 + Math.random() * 900000);
        const randomOtp = 111111;

        setOtp(prev => {
            console.log(randomOtp);
            signInWithPhoneNumber(phoneNumber, randomOtp);
            return randomOtp;
        });
    }

    // Set local storage
    const setAuthenticated = async id => {
        try {
            await AsyncStorage.setItem('isLoggedIn', 'true');
            await AsyncStorage.setItem('userId', id.toString());
            console.log('Data saved successfully!');
        } catch (error) {
            console.log('Error saving data:', error);
        }
    };

    // Handle the button press
    async function signInWithPhoneNumber(phoneNumber, newOtp) {
        try {
            // Handling disabled state of the button
            setValid(false);
            setCode(null);
            setLoading(true);
            const response = await fetch(
                'https://www.fast2sms.com/dev/bulkV2?authorization=rL4MxpFumIvbgGOf0UaP2XBR8Wqo7y6Vi1lThK5jknDc3HswzN9rxfpFHbe0wcoWGOXTvP6RtDmAIdQ5&route=otp&variables_values=' +
                newOtp +
                '&route=otp&numbers=' +
                phoneNumber,
            ); // Replace with your API endpoint

            if (true) {
                setLoading(false);
                setConfirm(true);
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    }

    async function confirmCode() {
        setLoading(true);
        if (code == otp) {
            checkAuthentication();
        } else {
            console.log('Invalid Code');
            setLoading(false);
            onToggleSnackBar();
        }
    }

    const validateInputs = (text, type) => {
        if (type == 'phone') {
            setPhone(() => {
                return text.replace(/[^0-9]/g, '');
            });
        } else {
            setCode(() => {
                return text.replace(/[^0-9]/g, '');
            });
        }

        if (
            (type == 'phone' && text.length == 10) ||
            (type == 'otp' && text.length == 6)
        ) {
            setValid(true);
        } else {
            setValid(false);
        }
    };

    const editPhone = () => {
        // setPhone(null);
        setConfirm(false);
        setValid(true);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={style.mainContainer}>
                {isChecking && (
                    <View style={style.loadingContainer}>
                        <ActivityIndicator animating={isChecking} color={'#0047ab'} />
                    </View>
                )}
                <View style={style.headerContainer}>
                    <Text style={style.headerText}>Login here</Text>
                    <Text style={style.subHeaderText}>
                        Welcome back you've been missed!
                    </Text>
                    {confirm && (
                        <View style={style.editPhone}>
                            <Text style={[style.subHeaderText, { marginRight: 5 }]}>
                                {phone}
                            </Text>
                            <TouchableOpacity onPress={editPhone}>
                                <FeatherIcon name="edit" size={16} color="#000" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <View style={{ marginVertical: 20 }}>
                    {!confirm && (
                        <AppTextInput
                            onChangeText={text => validateInputs(text, 'phone')}
                            value={phone}
                            maxLength={10}
                            minLength={10}
                            type={phone}
                            keyboardType="decimal-pad"
                            placeholder="Mobile No"
                        />
                    )}
                    {confirm && (
                        <AppTextInput
                            onChangeText={text => validateInputs(text, 'otp')}
                            value={code}
                            maxLength={6}
                            minLength={6}
                            type={code}
                            keyboardType="decimal-pad"
                            placeholder="OTP"
                        />
                    )}
                </View>
                <TouchableOpacity
                    disabled={!valid}
                    onPress={() =>
                        !confirm ? generateOTP(phone) && handleResendOTP() : confirmCode()
                    }
                    style={valid ? style.signInButton : style.signInButtonDisabled}>
                    <Text style={style.signInText}>
                        {!confirm ? 'Send OTP' : 'Verify OTP'}
                    </Text>
                    {loading && <ActivityIndicator animating={true} color={'#fff'} />}
                </TouchableOpacity>
                {confirm && (
                    <>
                        {count != 0 ? (
                            <View style={{ paddingTop: 30 }}>
                                <Text style={style.semiboldText}>
                                    Resend OTP in {count} sec
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    generateOTP(phone);
                                    handleResendOTP();
                                }}
                                style={{ paddingTop: 30 }}>
                                <Text style={style.activeText}>Resend OTP</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <Snackbar
                    style={{
                        backgroundColor: '#c62828',
                        width: '100%',
                        marginHorizontal: 20,
                    }}
                    visible={visible}
                    duration={2000}
                    onDismiss={onDismissSnackBar}
                    action={{
                        label: 'OK',
                        labelStyle: { color: '#fff' },
                        onPress: () => {
                            // Do something
                        },
                    }}>
                    Invalid Code
                </Snackbar>

                {/* <View style={{ marginVertical: 30 }} >
                        <Text style={[style.semiboldText, { color: Colors.primary }]} >
                            Or continue with
                        </Text>

                        <View style={style.iconsContainer} >
                            <TouchableOpacity style={style.iconStyle} >
                                <Ionicons
                                    name="logo-google"
                                    color={Colors.text}
                                    size={Spacing * 2}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={style.iconStyle} >
                                <Ionicons
                                    name="logo-apple"
                                    color={Colors.text}
                                    size={Spacing * 2}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={style.iconStyle} >
                                <Ionicons
                                    name="logo-facebook"
                                    color={Colors.text}
                                    size={Spacing * 2}
                                />
                            </TouchableOpacity>
                        </View>
                    </View> */}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default Login;
