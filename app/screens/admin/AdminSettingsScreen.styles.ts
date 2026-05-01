import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme';

export function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.bg,
    },

    appHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 20,
    },
    appLogo: {
      fontSize: 22,
      fontWeight: '700',
      color: C.text,
      letterSpacing: -0.5,
    },
    appSub: {
      fontSize: 12,
      color: C.textMuted,
      marginTop: 2,
    },
    adminPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.greenDim,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 5,
    },
    adminPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.green,
    },

    sectionLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: C.text,
    },

    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: C.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 14,
      paddingBottom: 20,
      minHeight: 280,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 14,
    },
    sheetHandle: {
      width: 48,
      height: 5,
      backgroundColor: C.border,
      borderRadius: 999,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: C.text,
    },
    sheetClose: {
      padding: 8,
    },
    sheetBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: C.textSub,
    },
    input: {
      backgroundColor: C.surface2,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: C.text,
    },
    sheetFooter: {
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: C.border,
    },
    saveBtn: {
      backgroundColor: C.green,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
