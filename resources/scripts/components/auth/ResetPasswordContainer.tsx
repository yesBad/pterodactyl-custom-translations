import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { parse } from 'query-string';
import { Link } from 'react-router-dom';
import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import lang from '../../../../lang.json';

interface Values {
    password: string;
    passwordConfirmation: string;
}

export default ({ match, location }: RouteComponentProps<{ token: string }>) => {
    const [ email, setEmail ] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = parse(location.search);
    if (email.length === 0 && parsed.email) {
        setEmail(parsed.email as string);
    }

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: match.params.token, password, passwordConfirmation })
            .then(() => {
                // @ts-ignore
                window.location = '/';
            })
            .catch(error => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                password: '',
                passwordConfirmation: '',
            }}
            validationSchema={object().shape({
                password: string().required('A new password is required.')
                    .min(8, 'Your new password should be at least 8 characters in length.'),
                passwordConfirmation: string()
                    .required('Your new password does not match.')
                    // @ts-ignore
                    .oneOf([ ref('password'), null ], 'Your new password does not match.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer
                    title={lang.reset_password}
                    css={tw`w-full flex`}
                >
                    <div>
                        <label>Email</label>
                        <Input value={email} isLight disabled/>
                    </div>
                    <div css={tw`mt-6`}>
                        <Field
                            light
                            label={lang.new_password}
                            name={'password'}
                            type={'password'}
                            description={lang.password_somethingsomething_safesafe}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Field
                            light
                            label={lang.confirm_new_pass}
                            name={'passwordConfirmation'}
                            type={'password'}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Button
                            size={'xlarge'}
                            type={'submit'}
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                        >
                            {lang.reset_password}
                        </Button>
                    </div>
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={tw`text-xs text-neutral-500 tracking-wide no-underline uppercase hover:text-neutral-600`}
                        >
                            {lang.return_to_fuckery}
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
